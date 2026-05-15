import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json();
  const {
    restaurant_id, branch_id, arrival_time, party_size,
    guest_name, guest_phone, notes, linked_order_items,
  } = body;

  if (!restaurant_id || !branch_id || !arrival_time || !party_size) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  let linked_order_id: string | null = null;

  if (Array.isArray(linked_order_items) && linked_order_items.length > 0) {
    const itemIds = linked_order_items.map((i: any) => i.menu_item_id);
    const { data: menuItems } = await admin
      .from('menu_items')
      .select('id, name, price')
      .in('id', itemIds);

    if (menuItems?.length) {
      const subtotal = linked_order_items.reduce((sum: number, i: any) => {
        const m = menuItems.find((x) => x.id === i.menu_item_id);
        return sum + (m ? Number(m.price) * i.quantity : 0);
      }, 0);
      const tax = Math.round(subtotal * 0.15 * 100) / 100;

      const { data: order } = await admin
        .from('orders')
        .insert({
          restaurant_id,
          branch_id,
          customer_id: user?.id ?? null,
          guest_name,
          guest_phone,
          order_type: 'dine_in',
          status: 'placed',
          requested_for: arrival_time,
          currency: 'SAR',
          subtotal,
          tax_total: tax,
          grand_total: subtotal + tax,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (order) {
        linked_order_id = order.id;
        await admin.from('order_items').insert(
          linked_order_items.map((i: any) => {
            const m = menuItems.find((x) => x.id === i.menu_item_id)!;
            return {
              order_id: order.id,
              menu_item_id: m.id,
              name_snapshot: m.name,
              unit_price: m.price,
              quantity: i.quantity,
              line_total: Number(m.price) * i.quantity,
            };
          })
        );
      }
    }
  }

  const { data: reservation, error } = await admin
    .from('reservations')
    .insert({
      restaurant_id,
      branch_id,
      customer_id: user?.id ?? null,
      guest_name,
      guest_phone,
      party_size,
      arrival_time,
      notes,
      linked_order_id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservation });
}
