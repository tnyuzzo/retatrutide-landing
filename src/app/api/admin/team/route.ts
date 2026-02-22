import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireRole, AuthError } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VALID_ROLES = ['manager', 'seller', 'warehouse'];
const VALID_ROLES_WITH_CUSTOMER = ['manager', 'seller', 'warehouse', 'customer'];

async function handleGet(req: NextRequest) {
    const { user: caller, role: callerRole } = await verifyAuth(req);
    requireRole(callerRole, ['super_admin', 'manager', 'seller', 'warehouse']);

    if (callerRole === 'seller' || callerRole === 'warehouse') {
        const { data: myProfile, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email, full_name, role, is_active, phone, created_at')
            .eq('id', caller.id)
            .single();

        if (error) {
            return NextResponse.json({ error: `Failed to fetch profile: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ members: myProfile ? [myProfile] : [] });
    }

    const { data: members, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role, is_active, phone, created_at, pending_removal, removal_requested_by, removal_requested_at')
        .neq('role', 'customer')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: `Failed to fetch team: ${error.message}` }, { status: 500 });
    }

    const membersWithEmail = await Promise.all(
        (members || []).map(async (m) => {
            if (m.email) return m;
            try {
                const { data } = await supabaseAdmin.auth.admin.getUserById(m.id);
                return { ...m, email: data?.user?.email || '' };
            } catch {
                return m;
            }
        })
    );

    return NextResponse.json({ members: membersWithEmail });
}

async function handleInvite(req: NextRequest, body: Record<string, unknown>) {
    const { user: caller, role: callerRole } = await verifyAuth(req);
    requireRole(callerRole, ['super_admin', 'manager']);

    const { email, role, fullName, phone } = body as {
        email?: string; role?: string; fullName?: string; phone?: string;
    };

    if (!email || !role) {
        return NextResponse.json({ error: 'email and role are required' }, { status: 400 });
    }

    if (callerRole === 'manager' && role !== 'seller') {
        return NextResponse.json({ error: 'Managers can only invite sellers' }, { status: 403 });
    }

    if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    let existingUser = null;
    let page = 1;
    const perPage = 50;
    while (true) {
        const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (listError || !data?.users?.length) break;
        const found = data.users.find((u) => u.email === email);
        if (found) { existingUser = found; break; }
        if (data.users.length < perPage) break;
        page++;
    }

    if (existingUser) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            app_metadata: { role },
        });
        if (authError) {
            return NextResponse.json({ error: `Failed to update role: ${authError.message}` }, { status: 500 });
        }

        const profileData: Record<string, unknown> = {
            id: existingUser.id,
            email: existingUser.email,
            role,
            invited_by: caller.id,
            full_name: fullName || existingUser.user_metadata?.full_name || '',
            is_active: true,
            updated_at: new Date().toISOString(),
        };
        if (phone) profileData.phone = phone;

        await supabaseAdmin.from('profiles').upsert(profileData, { onConflict: 'id' });

        return NextResponse.json({ success: true, message: 'Existing user promoted to staff', userId: existingUser.id });
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName || '' },
    });

    if (inviteError) {
        return NextResponse.json({ error: `Failed to invite: ${inviteError.message}` }, { status: 500 });
    }

    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(inviteData.user.id, {
        app_metadata: { role },
    });
    if (roleError) {
        return NextResponse.json({ error: `User invited but role assignment failed: ${roleError.message}` }, { status: 500 });
    }

    const newProfileData: Record<string, unknown> = {
        id: inviteData.user.id,
        email,
        role,
        invited_by: caller.id,
        full_name: fullName || '',
        is_active: true,
        updated_at: new Date().toISOString(),
    };
    if (phone) newProfileData.phone = phone;

    await supabaseAdmin.from('profiles').upsert(newProfileData, { onConflict: 'id' });

    return NextResponse.json({ success: true, message: 'Invitation sent', userId: inviteData.user.id });
}

async function handleRevoke(req: NextRequest, body: Record<string, unknown>) {
    const { user: caller, role: callerRole } = await verifyAuth(req);
    requireRole(callerRole, ['super_admin', 'manager']);

    const { userId } = body as { userId?: string };
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    if (userId === caller.id) return NextResponse.json({ error: 'Cannot revoke your own access' }, { status: 400 });

    const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('profiles').select('id, email, role, full_name').eq('id', userId).single();

    if (targetError || !targetProfile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (callerRole === 'manager') {
        if (targetProfile.role !== 'seller') {
            return NextResponse.json({ error: 'Managers can only remove sellers' }, { status: 403 });
        }
        await supabaseAdmin.from('profiles').update({
            pending_removal: true,
            removal_requested_by: caller.id,
            removal_requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).eq('id', userId);

        return NextResponse.json({ success: true, message: 'Removal request sent for admin approval', pending: true });
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { role: 'customer' } });
    await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: targetProfile.email,
        role: 'customer',
        is_active: false,
        pending_removal: false,
        removal_requested_by: null,
        removal_requested_at: null,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return NextResponse.json({ success: true, message: 'Member access revoked' });
}

async function handleApproveRemoval(req: NextRequest, body: Record<string, unknown>) {
    const { role: callerRole } = await verifyAuth(req);
    requireRole(callerRole, ['super_admin']);

    const { userId } = body as { userId?: string };
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const { data: profile } = await supabaseAdmin
        .from('profiles').select('id, email, pending_removal').eq('id', userId).single();

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!profile.pending_removal) {
        return NextResponse.json({ error: 'No pending removal request for this user' }, { status: 400 });
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { role: 'customer' } });
    await supabaseAdmin.from('profiles').update({
        role: 'customer',
        is_active: false,
        pending_removal: false,
        removal_requested_by: null,
        removal_requested_at: null,
        updated_at: new Date().toISOString(),
    }).eq('id', userId);

    return NextResponse.json({ success: true, message: 'Removal approved, access revoked' });
}

async function handleRejectRemoval(req: NextRequest, body: Record<string, unknown>) {
    const { role: callerRole } = await verifyAuth(req);
    requireRole(callerRole, ['super_admin']);

    const { userId } = body as { userId?: string };
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const { data: profile } = await supabaseAdmin
        .from('profiles').select('id, pending_removal').eq('id', userId).single();

    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!profile.pending_removal) {
        return NextResponse.json({ error: 'No pending removal request for this user' }, { status: 400 });
    }

    await supabaseAdmin.from('profiles').update({
        pending_removal: false,
        removal_requested_by: null,
        removal_requested_at: null,
        updated_at: new Date().toISOString(),
    }).eq('id', userId);

    return NextResponse.json({ success: true, message: 'Removal request rejected' });
}

async function handleSetRole(req: NextRequest, body: Record<string, unknown>) {
    const { role: callerRole } = await verifyAuth(req);
    requireRole(callerRole, ['super_admin']);

    const { userId, newRole } = body as { userId?: string; newRole?: string };
    if (!userId || !newRole) {
        return NextResponse.json({ error: 'userId and newRole are required' }, { status: 400 });
    }
    if (!VALID_ROLES_WITH_CUSTOMER.includes(newRole)) {
        return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES_WITH_CUSTOMER.join(', ')}` }, { status: 400 });
    }

    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getUserError || !userData?.user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { role: newRole } });
    await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: userData.user.email,
        role: newRole,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return NextResponse.json({ success: true, userId, newRole });
}

async function handleUpdate(req: NextRequest, body: Record<string, unknown>) {
    const { user: caller, role: callerRole } = await verifyAuth(req);
    requireRole(callerRole, ['super_admin', 'manager', 'seller', 'warehouse']);

    const { userId, fullName, role, phone } = body as {
        userId?: string; fullName?: string; role?: string; phone?: string;
    };
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const isSelf = userId === caller.id;

    const { data: targetProfile } = await supabaseAdmin
        .from('profiles').select('id, email, role').eq('id', userId).single();
    if (!targetProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if ((callerRole === 'seller' || callerRole === 'warehouse') && !isSelf) {
        return NextResponse.json({ error: 'You can only edit your own profile' }, { status: 403 });
    }
    if ((callerRole === 'seller' || callerRole === 'warehouse') && role) {
        return NextResponse.json({ error: 'You cannot change your role' }, { status: 403 });
    }
    if (callerRole === 'manager') {
        if (isSelf && role) return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
        if (!isSelf && targetProfile.role !== 'seller') {
            return NextResponse.json({ error: 'Managers can only edit sellers' }, { status: 403 });
        }
    }
    if (callerRole === 'super_admin' && role && isSelf) {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    if (role) {
        if (!VALID_ROLES.includes(role)) {
            return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
        }
        await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { role } });
    }

    if (fullName !== undefined) {
        await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { full_name: fullName } });
    }

    const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role) profileUpdate.role = role;
    if (fullName !== undefined) profileUpdate.full_name = fullName;
    if (phone !== undefined) profileUpdate.phone = phone || null;

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email: userData?.user?.email || targetProfile.email,
        ...profileUpdate,
    }, { onConflict: 'id' });

    return NextResponse.json({ success: true, message: 'Member updated', userId });
}

const POST_ACTIONS: Record<string, (req: NextRequest, body: Record<string, unknown>) => Promise<NextResponse>> = {
    invite: handleInvite,
    revoke: handleRevoke,
    'set-role': handleSetRole,
    update: handleUpdate,
    'approve-removal': handleApproveRemoval,
    'reject-removal': handleRejectRemoval,
};

export async function GET(req: NextRequest) {
    try {
        return await handleGet(req);
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Team API GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body || {};
        const actionHandler = POST_ACTIONS[action];
        if (!actionHandler) {
            return NextResponse.json(
                { error: `Invalid or missing action. Must be one of: ${Object.keys(POST_ACTIONS).join(', ')}` },
                { status: 400 }
            );
        }
        return await actionHandler(req, body);
    } catch (err) {
        if (err instanceof AuthError) {
            return NextResponse.json({ error: err.message }, { status: err.statusCode });
        }
        console.error('Team API POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
