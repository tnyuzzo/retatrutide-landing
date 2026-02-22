import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { role } = await verifyAuth(req);
        requireRole(role, ['super_admin', 'manager']);

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id'); // email of customer
        const search = searchParams.get('search')?.trim() || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const sort = searchParams.get('sort') || 'total_spent_desc';

        // Single customer detail (by email)
        if (id) {
            const normalizedEmail = id.toLowerCase().trim();

            // Get customer profile
            const { data: customer } = await supabaseAdmin
                .from('customers')
                .select('*')
                .eq('email', normalizedEmail)
                .maybeSingle();

            // Get all orders for this customer
            const { data: orders, error: ordersError } = await supabaseAdmin
                .from('orders')
                .select('*')
                .eq('email', normalizedEmail)
                .order('created_at', { ascending: false });

            if (ordersError) {
                return NextResponse.json({ error: ordersError.message }, { status: 500 });
            }

            const validOrders = (orders || []).filter(o =>
                ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)
            );
            const totalSpent = validOrders.reduce((sum, o) => sum + (o.fiat_amount || 0), 0);

            return NextResponse.json({
                customer: {
                    email: normalizedEmail,
                    full_name: customer?.full_name || orders?.[0]?.shipping_address?.full_name || '',
                    phone: customer?.phone || orders?.[0]?.shipping_address?.phone || null,
                    total_spent: totalSpent,
                    order_count: validOrders.length,
                    first_purchase: validOrders.length > 0 ? validOrders[validOrders.length - 1].created_at : null,
                    last_purchase: validOrders.length > 0 ? validOrders[0].created_at : null,
                    created_at: customer?.created_at || null,
                },
                orders: orders || [],
            });
        }

        // List customers with LTV via RPC
        const offset = (page - 1) * limit;

        const [ltvResult, aggregatesResult] = await Promise.all([
            supabaseAdmin.rpc('get_customer_ltv', {
                p_search: search || null,
                p_limit: limit,
                p_offset: offset,
                p_sort: sort,
            }),
            supabaseAdmin.rpc('get_ltv_aggregates'),
        ]);

        if (ltvResult.error) {
            // Fallback: RPC not yet deployed, use manual aggregation
            console.warn('get_customer_ltv RPC not available, using fallback:', ltvResult.error.message);
            return fallbackCustomerList(search, page, limit);
        }

        const aggregates = aggregatesResult.data?.[0] || {
            total_customers: 0,
            avg_ltv: 0,
            repeat_purchase_rate: 0,
            avg_orders_per_customer: 0,
        };

        return NextResponse.json({
            customers: ltvResult.data || [],
            total: aggregates.total_customers || 0,
            page,
            limit,
            aggregates,
        });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Customers API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Fallback if RPCs are not yet deployed
async function fallbackCustomerList(search: string, page: number, limit: number) {
    const { data: allOrders, error } = await supabaseAdmin
        .from('orders')
        .select('email, fiat_amount, status, created_at')
        .not('email', 'is', null)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
        aggregates: {
            total_customers: customers.length,
            avg_ltv: customers.length > 0 ? Math.round(customers.reduce((s, c) => s + c.total_spent, 0) / customers.length) : 0,
            repeat_purchase_rate: customers.length > 0
                ? Math.round((customers.filter(c => c.order_count > 1).length / customers.length) * 100)
                : 0,
            avg_orders_per_customer: customers.length > 0
                ? +(customers.reduce((s, c) => s + c.order_count, 0) / customers.length).toFixed(1)
                : 0,
        },
    });
}
