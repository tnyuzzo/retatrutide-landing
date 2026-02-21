import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { Resend } from 'resend';
import { lowStockAlertEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'Aura Peptides <onboarding@resend.dev>';
const EMAIL_REPLY_TO = 'support@aurapeptides.eu';
const SKU = 'RET-KIT-1';

export async function GET(req: NextRequest) {
    try {
        const { role, supabase } = await verifyAuth(req);
        requireRole(role, ['super_admin', 'manager', 'warehouse']);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')));
        const type = searchParams.get('type');

        let query = supabase
            .from('inventory_movements')
            .select('*', { count: 'exact' });

        if (type) query = query.eq('type', type);

        const rangeFrom = (page - 1) * limit;
        const rangeTo = rangeFrom + limit - 1;

        const { data: movements, count, error } = await query
            .order('created_at', { ascending: false })
            .range(rangeFrom, rangeTo);

        // Also fetch current stock
        const { data: inventory } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('sku', SKU)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            movements: movements || [],
            total: count || 0,
            page,
            limit,
            current_stock: inventory?.quantity ?? 0,
        });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Inventory GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { user, role, supabase } = await verifyAuth(req);
        const body = await req.json();
        const { type, quantity, reason } = body;

        if (!type || quantity == null) {
            return NextResponse.json({ error: 'type and quantity are required' }, { status: 400 });
        }

        if (!['add', 'remove', 'edit'].includes(type)) {
            return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
        }

        if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
            return NextResponse.json({ error: 'quantity must be a non-negative integer' }, { status: 400 });
        }

        if (type === 'add') {
            requireRole(role, ['super_admin', 'manager', 'warehouse']);
        } else {
            requireRole(role, ['super_admin', 'manager']);
        }

        const { data: inventory, error: fetchError } = await supabase
            .from('inventory')
            .select('*')
            .eq('sku', SKU)
            .single();

        if (fetchError || !inventory) {
            return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
        }

        const previousQuantity = inventory.quantity;
        let newQuantity: number;

        if (type === 'add') {
            newQuantity = previousQuantity + quantity;
        } else if (type === 'remove') {
            newQuantity = Math.max(0, previousQuantity - quantity);
        } else {
            newQuantity = quantity;
        }

        const delta = newQuantity - previousQuantity;

        // Optimistic concurrency: only update if quantity hasn't changed
        const { data: updatedInventory, error: updateError } = await supabase
            .from('inventory')
            .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
            .eq('sku', SKU)
            .eq('quantity', previousQuantity)
            .select()
            .single();

        if (updateError || !updatedInventory) {
            return NextResponse.json({ error: 'Inventory was modified concurrently, please retry' }, { status: 409 });
        }

        // Log movement
        const performedByName = user.user_metadata?.full_name || user.email || 'Unknown';

        await supabase.from('inventory_movements').insert({
            sku: SKU,
            type,
            quantity: delta,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reason: reason || null,
            performed_by: user.id,
            performed_by_name: performedByName,
        });

        // Low stock alert
        const LOW_STOCK_THRESHOLD = 20;
        if (newQuantity < LOW_STOCK_THRESHOLD && process.env.RESEND_API_KEY) {
            const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
            if (adminEmail) {
                const { subject, html } = lowStockAlertEmail({ sku: SKU, currentQuantity: newQuantity, threshold: LOW_STOCK_THRESHOLD });
                resend.emails.send({ from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO, to: adminEmail, subject, html })
                    .catch(err => console.error('Low stock email error:', err));
            }
        }

        return NextResponse.json({ success: true, inventory: updatedInventory });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Inventory POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
