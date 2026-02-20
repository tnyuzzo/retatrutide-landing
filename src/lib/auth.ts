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

    const role = (user.app_metadata?.role as string) || 'customer';

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
