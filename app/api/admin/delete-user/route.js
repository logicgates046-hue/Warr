import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  const { targetUserId, callerAccessToken } = await request.json();

  const { data: callerData, error: callerError } = await supabase.auth.getUser(callerAccessToken);

  if (callerError || !callerData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', callerData.user.id)
    .single();

  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
