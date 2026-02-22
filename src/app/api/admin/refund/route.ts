import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { refundConfirmationEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'Aura Peptides <onboarding@resend.dev>';
const EMAIL_REPLY_TO = 'support@aurapeptides.eu';

export async function POST(req: NextRequest) {
    try {
        const { user, role } = await verifyAuth(req);
        requireRole(role, ['super_admin', 'manager']);

        const body = await req.json();
        const { order_id, amount, reason } = body;

        if (!order_id) {
            return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
        }

        // Fetch order
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .single();

        if (fetchError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Validate order status
        if (!['paid', 'processing', 'shipped'].includes(order.status)) {
            return NextResponse.json({
                error: `Cannot refund order with status '${order.status}'. Must be paid, processing, or shipped.`,
            }, { status: 400 });
        }

        const orderAmount = order.fiat_amount || 0;
        const refundAmount = amount || orderAmount;
        const isPartial = refundAmount < orderAmount;

        if (refundAmount <= 0 || refundAmount > orderAmount) {
            return NextResponse.json({
                error: `Refund amount must be between 1 and ${orderAmount}`,
            }, { status: 400 });
        }

        // Update order status
        const newStatus = isPartial ? 'partially_refunded' : 'refunded';
        const refundNote = `Refund €${refundAmount} by ${user.id} — ${reason || 'No reason provided'}`;
        const existingNotes = order.notes ? `${order.notes}\n${refundNote}` : refundNote;

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: newStatus,
                notes: existingNotes,
                updated_at: new Date().toISOString(),
            })
            .eq('id', order_id);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        // Restore inventory
        let totalToRestore = 1;
        if (order.items && Array.isArray(order.items)) {
            totalToRestore = order.items.reduce(
                (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1), 0
            );
        }

        for (let attempt = 0; attempt < 3; attempt++) {
            const { data: inv } = await supabaseAdmin
                .from('inventory')
                .select('quantity')
                .eq('sku', 'RET-KIT-1')
                .single();

            if (!inv) break;

            const newQty = inv.quantity + totalToRestore;
            const { data: updated } = await supabaseAdmin
                .from('inventory')
                .update({ quantity: newQty, updated_at: new Date().toISOString() })
                .eq('sku', 'RET-KIT-1')
                .eq('quantity', inv.quantity)
                .select('quantity')
                .single();

            if (updated) {
                const { data: profile } = await supabaseAdmin
                    .from('profiles').select('full_name').eq('id', user.id).single();

                await supabaseAdmin.from('inventory_movements').insert({
                    sku: 'RET-KIT-1',
                    type: 'refund',
                    quantity: totalToRestore,
                    previous_quantity: inv.quantity,
                    new_quantity: newQty,
                    reason: `Refund order #${order.order_number || order.reference_id}`,
                    performed_by: user.id,
                    performed_by_name: profile?.full_name || 'Staff',
                    order_id: order.id,
                });
                break;
            }
        }

        // Send refund confirmation email to customer
        if (order.email && process.env.RESEND_API_KEY) {
            try {
                const { subject, html } = refundConfirmationEmail({
                    referenceId: order.reference_id,
                    fiatAmount: orderAmount,
                    refundAmount,
                    isPartial,
                });

                await resend.emails.send({
                    from: EMAIL_FROM,
                    replyTo: EMAIL_REPLY_TO,
                    to: order.email,
                    subject,
                    html,
                });
            } catch (emailErr) {
                console.error('Failed to send refund confirmation email:', emailErr);
            }
        }

        console.log(`Refund: Order ${order.order_number || order.reference_id} — €${refundAmount} (${isPartial ? 'partial' : 'full'}) by ${user.id}`);

        return NextResponse.json({
            success: true,
            refundAmount,
            isPartial,
            newStatus,
            inventoryRestored: totalToRestore,
        });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Refund API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
