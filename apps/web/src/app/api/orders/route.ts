import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { computePricing } from '@arkan/shared';
import { pickGateway } from '@/lib/payments';

export async function POST(req: Request) {
  const body = await req.json();
  const {
    restaurant_id,
    order_type,
    items,
    slot_start,
    slot_end,
    payment_method,
    guest_name,
    guest_phone,
    delivery_address,
    notes,
    coupon_code,
    customer_email,
  } = body;

  if (!restaurant_id || !Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, currency, base_delivery_fee, country_code')
    .eq('id', restaurant_id)
    .single();
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const itemIds = items.map((i: any) => i.menu_item_id);
  const { data: menuItems } = await admin
    .from('menu_items')
    .select('id, name, price, status')
    .in('id', itemIds);

  if (!menuItems || menuItems.length !== itemIds.length) {
    return NextResponse.json({ error: 'Some items not found' }, { status: 400 });
  }

  let lines;
  try {
    lines = items.map((i: any) => {
      const m = menuItems.find((x) => x.id === i.menu_item_id)!;
      if (m.status !== 'available') throw new Error(`${m.name} is unavailable`);
      return {
        menu_item_id: m.id,
        name: m.name,
        unit_price: Number(m.price),
        quantity: i.quantity,
      };
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const pricing = computePricing({
    lines,
    delivery_fee: order_type === 'delivery' ? Number(restaurant.base_delivery_fee) : 0,
    tax_rate: 0.15,
  });

  const isCash = payment_method === 'cash';

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      restaurant_id,
      customer_id: user?.id ?? null,
      guest_name,
      guest_phone,
      order_type,
      status: isCash ? 'placed' : 'pending_payment',
      requested_for: slot_start ?? null,
      slot_start: slot_start ?? null,
      slot_end: slot_end ?? null,
      delivery_address_snapshot: delivery_address ? { address: delivery_address } : null,
      currency: restaurant.currency,
      subtotal: pricing.subtotal,
      delivery_fee: pricing.delivery_fee,
      tax_total: pricing.tax,
      grand_total: pricing.grand_total,
      payment_method,
      payment_status: 'pending',
      notes,
      coupon_code,
      placed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('order_items').insert(
    lines.map((l) => ({
      order_id: order.id,
      menu_item_id: l.menu_item_id,
      name_snapshot: l.name,
      unit_price: l.unit_price,
      quantity: l.quantity,
      line_total: l.unit_price * l.quantity,
    }))
  );

  await admin.from('order_status_history').insert({
    order_id: order.id,
    status: order.status,
    notes: 'Order placed',
  });

  // Cash → done. Card/Mada/STC Pay → create a payment intent and return the redirect URL.
  if (isCash) {
    return NextResponse.json({ order, redirect_url: null });
  }

  const gateway = pickGateway(payment_method, restaurant.country_code);
  if (!gateway) {
    return NextResponse.json({ error: 'No gateway available for this method' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const returnUrl = `${appUrl}/orders/${order.id}/return`;

  try {
    const intent = await gateway.createIntent({
      amount: pricing.grand_total,
      currency: restaurant.currency,
      method: payment_method,
      order_id: order.id,
      customer_email: customer_email ?? user?.email,
      return_url: returnUrl,
    });

    await admin
      .from('orders')
      .update({ payment_reference: intent.id })
      .eq('id', order.id);

    return NextResponse.json({
      order,
      redirect_url: intent.redirect_url,
      client_secret: intent.client_secret,
    });
  } catch (e: any) {
    await admin
      .from('orders')
      .update({ status: 'failed', payment_status: 'failed' })
      .eq('id', order.id);
    return NextResponse.json({ error: `Payment setup failed: ${e.message}` }, { status: 500 });
  }
}
