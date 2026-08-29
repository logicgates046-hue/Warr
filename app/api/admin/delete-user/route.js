import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { targetUserId, callerAccessToken } = await request.json();

    if (!targetUserId || !callerAccessToken) {
      return NextResponse.json(
        { error: 'Missing targetUserId or callerAccessToken' },
        { status: 400 }
      );
    }

    // 1. Verify the caller is logged in
    const { data: callerData, error: callerError } =
      await supabase.auth.getUser(callerAccessToken);

    if (callerError || !callerData.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Verify the caller is an admin
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', callerData.user.id)
      .single();

    if (!callerProfile?.is_admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // 3. Prevent admin from deleting themselves
    if (targetUserId === callerData.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // 4. Delete all votes belonging to this user (order matters)
    await supabaseAdmin
      .from('battle_votes')
      .delete()
      .eq('user_id', targetUserId);

    await supabaseAdmin
      .from('candidature_votes')
      .delete()
      .eq('user_id', targetUserId);

    await supabaseAdmin
      .from('rankings_votes')
      .delete()
      .eq('user_id', targetUserId);

    // 5. Delete the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', targetUserId);

    if (profileError) {
      return NextResponse.json(
        { error: `Failed to delete profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 6. Finally delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      targetUserId
    );

    if (authError) {
      return NextResponse.json(
        { error: `Failed to delete auth user: ${authError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
