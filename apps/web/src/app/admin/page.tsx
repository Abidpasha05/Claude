import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@arkan/shared';

async function getRestaurantId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .limit(1)
    .single();
  return m?.restaurant_id as string;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const rid = await getRestaurantId();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [orders, pendingFeedback, reservations] = await Promise.all([
    supabase.from('orders').select('grand_total, status, currency').eq('restaurant_id', rid).gte('created_at', todayStart.toISOString()),
    supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('restaurant_id', rid).eq('status', 'open'),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('restaurant_id', rid).gte('arrival_time', todayStart.toISOString()),
  ]);

  const todayRevenue = (orders.data ?? []).reduce((s, o) => s + Number(o.grand_total), 0);
  const todayCount = orders.data?.length ?? 0;
  const currency = orders.data?.[0]?.currency ?? 'SAR';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-neutral-600 mb-6">Today at a glance.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Today's revenue" value={formatMoney(todayRevenue, currency)} />
        <Stat label="Orders today" value={String(todayCount)} />
        <Stat label="Open complaints" value={String(pendingFeedback.count ?? 0)} />
        <Stat label="Today's reservations" value={String(reservations.count ?? 0)} />
      </div>

      <div className="mt-8 card p-6">
        <h2 className="font-semibold mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <a className="btn-secondary text-sm" href="/admin/daily-menu">Publish today's menu</a>
          <a className="btn-secondary text-sm" href="/admin/promotions">Create a promotion</a>
          <a className="btn-secondary text-sm" href="/admin/menu">Add menu item</a>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
