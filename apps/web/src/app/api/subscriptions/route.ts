import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { data: plan } = await admin
    .from('meal_plans')
    .select('*')
    .eq('id', body.meal_plan_id)
    .single();
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  const startDate = new Date(body.start_date);
  const endDate = new Date(startDate);
  if (plan.period === 'weekly') endDate.setDate(endDate.getDate() + 7);
  else endDate.setMonth(endDate.getMonth() + 1);

  const { data, error } = await admin
    .from('meal_subscriptions')
    .insert({
      restaurant_id: plan.restaurant_id,
      customer_id: user.id,
      meal_plan_id: plan.id,
      status: 'active',
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      meals_remaining: plan.meals_per_period,
      delivery_address_id: body.delivery_address_id,
      delivery_time_slot: body.delivery_time_slot,
      payment_status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subscription: data });
}
