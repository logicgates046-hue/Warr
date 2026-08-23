import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { targetUserId, callerAccessToken } = await request.json();

    if (!targetUserId || !callerAccessToken) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Verify the caller using the service role client
    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(callerAccessToken);

    if (callerError || !callerData.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if caller is admin
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', callerData.user.id)
      .single();

    if (!callerProfile?.is_admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // 1. Delete from Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (authDeleteError) {
      return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
    }

    // 2. Also delete from profiles table
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', targetUserId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
