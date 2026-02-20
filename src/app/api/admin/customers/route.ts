import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const { role, supabase } = await verifyAuth(req);
        requireRole(role, ['super_admin']);

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const search = searchParams.get('search');

        // Single customer detail
        if (id) {
            const { data: customer, error } = await supabase
                .from('orders')
                .select('*')
                .eq('email', id)
                .order('created_at', { ascending: false });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            const validOrders = (customer || []).filter(o =>
                ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)
            );
            const totalSpent = validOrders.reduce((sum, o) => sum + (o.fiat_amount || 0), 0);

            return NextResponse.json({
                customer: {
                    email: id,
                    total_spent: totalSpent,
                    order_count: validOrders.length,
                    first_purchase: validOrders.length > 0 ? validOrders[validOrders.length - 1].created_at : null,
                    last_purchase: validOrders.length > 0 ? validOrders[0].created_at : null,
                },
                orders: customer || [],
            });
        }

        // List unique customers by email with aggregates
        let query = supabase
            .from('orders')
            .select('email, fiat_amount, status, created_at')
            .not('email', 'is', null)
            .order('created_at', { ascending: false });

        const { data: allOrders, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Aggregate by email
        const customerMap = new Map<string, { email: string; total_spent: number; order_count: number; last_purchase: string }>();

        for (const order of (allOrders || [])) {
            if (!order.email) continue;
            const email = order.email.toLowerCase();

            if (search && !email.includes(search.toLowerCase())) continue;

            const existing = customerMap.get(email);
            const isValidStatus = ['paid', 'processing', 'shipped', 'delivered'].includes(order.status);

            if (existing) {
                if (isValidStatus) {
                    existing.total_spent += order.fiat_amount || 0;
                    existing.order_count += 1;
                }
            } else {
                customerMap.set(email, {
                    email,
                    total_spent: isValidStatus ? (order.fiat_amount || 0) : 0,
                    order_count: isValidStatus ? 1 : 0,
                    last_purchase: order.created_at,
                });
            }
        }

        const customers = Array.from(customerMap.values())
            .sort((a, b) => b.total_spent - a.total_spent);

        const offset = (page - 1) * limit;
        const paginated = customers.slice(offset, offset + limit);

        return NextResponse.json({
            customers: paginated,
            total: customers.length,
            page,
            limit,
        });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Customers API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
