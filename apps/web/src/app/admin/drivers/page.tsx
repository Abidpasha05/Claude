import { createClient } from '@/lib/supabase/server';
import { InviteDriver } from './invite-driver';

export default async function AdminDriversPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const restaurantId = m!.restaurant_id;

  const { data: drivers } = await supabase
    .from('restaurant_members')
    .select('user_id, is_active, profiles(full_name, email, phone), driver_profiles:profiles!user_id(status, current_latitude, current_longitude, last_seen_at, total_deliveries, vehicle_type, license_plate)')
    .eq('restaurant_id', restaurantId)
    .eq('role', 'driver');

  // Active deliveries with assigned driver, so the manager can see who has what.
  const { data: activeDeliveries } = await supabase
    .from('orders')
    .select('id, order_number, status, driver_id, slot_start, delivery_address_snapshot')
    .eq('restaurant_id', restaurantId)
    .eq('order_type', 'delivery')
    .in('status', ['ready_for_pickup', 'out_for_delivery']);

  const byDriver = new Map<string, any[]>();
  for (const o of activeDeliveries ?? []) {
    if (!o.driver_id) continue;
    if (!byDriver.has(o.driver_id)) byDriver.set(o.driver_id, []);
    byDriver.get(o.driver_id)!.push(o);
  }

  const unassigned = (activeDeliveries ?? []).filter((o) => !o.driver_id);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-neutral-600">Roster, current status, and live deliveries.</p>
        </div>
        <InviteDriver restaurantId={restaurantId} />
      </div>

      {unassigned.length > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50">
          <h2 className="font-semibold text-amber-900">Unassigned ({unassigned.length})</h2>
          <ul className="mt-2 text-sm text-amber-900 space-y-1">
            {unassigned.map((o) => (
              <li key={o.id}>
                #{o.order_number} · {o.delivery_address_snapshot?.address ?? '—'} ·{' '}
                {o.slot_start ? new Date(o.slot_start).toLocaleTimeString() : '—'}
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-700 mt-2">Drivers see these in their app and can self-claim.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {drivers?.map((d: any) => {
          const dp = d.driver_profiles;
          const assignments = byDriver.get(d.user_id) ?? [];
          const onlineDot =
            dp?.status === 'on_delivery' ? 'bg-blue-500'
            : dp?.status === 'online' ? 'bg-green-500'
            : dp?.status === 'on_break' ? 'bg-amber-500'
            : 'bg-neutral-300';
          return (
            <div key={d.user_id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{d.profiles?.full_name ?? d.profiles?.email}</h3>
                  <p className="text-sm text-neutral-500">{d.profiles?.phone ?? d.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${onlineDot}`} />
                  <span className="text-sm capitalize">{dp?.status?.replace('_', ' ') ?? 'offline'}</span>
                </div>
              </div>
              <div className="text-xs text-neutral-500 mt-2 grid grid-cols-2 gap-1">
                <div>Vehicle: {dp?.vehicle_type ?? '—'}</div>
                <div>Plate: {dp?.license_plate ?? '—'}</div>
                <div>Deliveries: {dp?.total_deliveries ?? 0}</div>
                <div>Last seen: {dp?.last_seen_at ? new Date(dp.last_seen_at).toLocaleTimeString() : '—'}</div>
              </div>
              {assignments.length > 0 ? (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-semibold text-neutral-500 mb-1">
                    Current delivery
                  </p>
                  {assignments.map((o) => (
                    <p key={o.id} className="text-sm">
                      #{o.order_number} · {o.status.replace('_', ' ')}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400 mt-3 border-t pt-3">Idle</p>
              )}
            </div>
          );
        })}
        {!drivers?.length && (
          <div className="card p-10 text-center text-neutral-500 col-span-2">
            No drivers linked. Invite one with their existing TableBite account email.
          </div>
        )}
      </div>
    </div>
  );
}
