import { SupabaseClient } from '@supabase/supabase-js';

const CHARS = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

function randomCode(length: number = 4): string {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return code;
}

export async function generateOrderNumber(
    supabase: SupabaseClient,
    maxAttempts: number = 20
): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
        const code = randomCode(4);
        const { data } = await supabase
            .from('orders')
            .select('id')
            .eq('order_number', code)
            .maybeSingle();
        if (!data) return code;
    }
    // Fallback to 6 chars if 4-char space is crowded
    return randomCode(6);
}
