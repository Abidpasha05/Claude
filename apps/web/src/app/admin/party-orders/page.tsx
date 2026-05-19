import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@aklio/shared';

export default async function AdminPartyOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: rows } = await supabase
    .from('party_orders')
    .select('*')
    .eq('restaurant_id', m!.restaurant_id)
    .order('event_date');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Party Orders</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {rows?.map((p: any) => (
          <div key={p.id} className="card p-5">
            <div className="flex justify-between">
              <h3 className="font-semibold">{p.event_name ?? p.contact_name}</h3>
              <span className="badge bg-neutral-100">{p.status}</span>
            </div>
            <p className="text-sm text-neutral-500">{p.party_number}</p>
            <div className="mt-3 text-sm space-y-1">
              <p><strong>Event:</strong> {new Date(p.event_date).toLocaleString()}</p>
              <p><strong>Guests:</strong> {p.guest_count}</p>
              <p><strong>Contact:</strong> {p.contact_name} · {p.contact_phone}</p>
              <p><strong>Service:</strong> {p.service_type}</p>
              {p.quote_amount && <p><strong>Quoted:</strong> {formatMoney(p.quote_amount)}</p>}
            </div>
            {p.special_requests && <p className="text-sm text-neutral-600 mt-2 italic">"{p.special_requests}"</p>}
          </div>
        ))}
        {!rows?.length && <div className="card p-10 text-center text-neutral-500 col-span-2">No party orders yet.</div>}
      </div>
    </div>
  );
}
