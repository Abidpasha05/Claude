import { createClient } from '@/lib/supabase/server';

export default async function AdminReservationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: rows } = await supabase
    .from('reservations')
    .select('*, restaurant_branches(name)')
    .eq('restaurant_id', m!.restaurant_id)
    .order('arrival_time', { ascending: true })
    .limit(200);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Reservations</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100">
            <tr className="text-left">
              <th className="px-4 py-3">Arrival</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{new Date(r.arrival_time).toLocaleString()}</td>
                <td className="px-4 py-3">{r.guest_name ?? '—'}<br /><span className="text-xs text-neutral-500">{r.guest_phone}</span></td>
                <td className="px-4 py-3">{r.party_size}</td>
                <td className="px-4 py-3">{r.restaurant_branches?.name}</td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
                <td className="px-4 py-3 text-neutral-600 max-w-xs truncate">{r.notes}</td>
              </tr>
            ))}
            {!rows?.length && <tr><td colSpan={6} className="p-10 text-center text-neutral-500">No reservations.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
