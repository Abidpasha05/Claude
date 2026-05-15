import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { restaurant_id, daily_menu_notifications = true, promotion_notifications = true } = await req.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { error } = await supabase
    .from('restaurant_followers')
    .upsert({
      restaurant_id,
      customer_id: user.id,
      daily_menu_notifications,
      promotion_notifications,
    });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get('restaurant_id');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  await supabase
    .from('restaurant_followers')
    .delete()
    .eq('restaurant_id', restaurant_id)
    .eq('customer_id', user.id);

  return NextResponse.json({ ok: true });
}
