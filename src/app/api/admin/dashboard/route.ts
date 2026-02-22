import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

export async function GET(req: NextRequest) {
    try {
        const { role } = await verifyAuth(req);
        requireRole(role, ['super_admin', 'manager']);

        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
        const dayOfWeek = now.getUTCDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - mondayOffset)).toISOString();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
        const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
        const endOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

        const revenueQuery = (gte: string | null, lt: string | null) => {
            let q = supabaseAdmin.from('orders').select('fiat_amount').in('status', REVENUE_STATUSES);
            if (gte) q = q.gte('created_at', gte);
            if (lt) q = q.lt('created_at', lt);
            return q;
        };

        const [
            revenueTotalResult,
            revenueTodayResult,
            revenueWeekResult,
            revenueMonthResult,
            revenueLastMonthResult,
            ordersTotalResult,
            ordersTodayResult,
            ordersWeekResult,
            ordersMonthResult,
            ordersToShipResult,
            inventoryResult,
            recentOrdersResult,
            shippingCostsResult,
            customersResult,
        ] = await Promise.all([
            revenueQuery(null, null),
            revenueQuery(startOfToday, null),
            revenueQuery(startOfWeek, null),
            revenueQuery(startOfMonth, null),
            revenueQuery(startOfLastMonth, endOfLastMonth),

            supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday),
            supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek),
            supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),

            supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),

            supabaseAdmin.from('inventory').select('quantity').eq('sku', 'RET-KIT-1').single(),

            supabaseAdmin.from('orders')
                .select('id, reference_id, order_number, created_at, fiat_amount, status, email, crypto_currency')
                .order('created_at', { ascending: false })
                .limit(5),

            // Shipping costs
            supabaseAdmin.from('orders').select('shipping_cost').in('status', ['shipped', 'delivered']).not('shipping_cost', 'is', null),

            // Total unique customers
            supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }),
        ]);

        const sum = (result: { data: Record<string, number>[] | null }, field: string) =>
            (result.data || []).reduce((s, o) => s + (o[field] || 0), 0);

        const stockQuantity = inventoryResult.data?.quantity ?? 0;

        const totalRevenue = sum(revenueTotalResult, 'fiat_amount');
        const totalPaidOrders = (revenueTotalResult.data || []).length;
        const totalShippingCosts = sum(shippingCostsResult, 'shipping_cost');

        return NextResponse.json({
            revenue: {
                total: totalRevenue,
                today: sum(revenueTodayResult, 'fiat_amount'),
                this_week: sum(revenueWeekResult, 'fiat_amount'),
                this_month: sum(revenueMonthResult, 'fiat_amount'),
                last_month: sum(revenueLastMonthResult, 'fiat_amount'),
            },
            orders: {
                total: ordersTotalResult.count || 0,
                today: ordersTodayResult.count || 0,
                this_week: ordersWeekResult.count || 0,
                this_month: ordersMonthResult.count || 0,
                to_ship: ordersToShipResult.count || 0,
            },
            inventory: {
                stock_quantity: stockQuantity,
                low_stock: stockQuantity < 20,
            },
            shipping_costs: totalShippingCosts,
            customers_total: customersResult.count || 0,
            avg_order_value: totalPaidOrders > 0 ? Math.round(totalRevenue / totalPaidOrders) : 0,
            recent_orders: recentOrdersResult.data || [],
        });
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Dashboard stats error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
