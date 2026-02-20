import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (_supabaseAdmin) return _supabaseAdmin;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    return _supabaseAdmin;
}

// Lazy getter for backward compat
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return Reflect.get(getSupabaseAdmin(), prop);
    },
});
