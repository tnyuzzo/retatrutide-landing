import { supabaseAdmin } from './supabase-admin';
import { NextRequest } from 'next/server';

export class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
    }
}

/**
 * Verify JWT from Authorization header and extract user + role
 */
export async function verifyAuth(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new AuthError('Missing authorization header', 401);
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
        throw new AuthError('Invalid or expired token', 401);
    }

    // Prefer app_metadata.role (set by team invite flow), fallback to profiles table
    let role = (user.app_metadata?.role as string) || '';
    if (!role || role === 'customer') {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile?.role && profile.role !== 'customer') {
            role = profile.role;
        }
    }
    if (!role) role = 'customer';

    return { user, role, supabase: supabaseAdmin };
}

/**
 * Require one of the specified roles
 */
export function requireRole(role: string, allowedRoles: string[]) {
    if (!allowedRoles.includes(role)) {
        throw new AuthError('Insufficient permissions', 403);
    }
}
