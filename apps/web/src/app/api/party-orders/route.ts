import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: party, error } = await admin
    .from('party_orders')
    .insert({
      restaurant_id: body.restaurant_id,
      customer_id: user?.id ?? null,
      contact_name: body.contact_name,
      contact_phone: body.contact_phone,
      contact_email: body.contact_email,
      event_name: body.event_name,
      event_date: body.event_date,
      guest_count: body.guest_count,
      service_type: body.service_type,
      venue_address: body.venue_address,
      selected_items: body.selected_items ?? [],
      special_requests: body.special_requests,
      status: 'inquiry',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ party });
}
