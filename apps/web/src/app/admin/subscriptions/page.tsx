import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@aklio/shared';

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const [plans, subs] = await Promise.all([
    supabase.from('meal_plans').select('*').eq('restaurant_id', m!.restaurant_id),
    supabase.from('meal_subscriptions').select('*, profiles(full_name, email), meal_plans(name)').eq('restaurant_id', m!.restaurant_id).order('created_at', { ascending: false }).limit(50),
  ]);

  return (
    <div className="p-8 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-2">Meal Plans</h1>
        <p className="text-neutral-600 mb-4">Weekly and monthly subscriptions you offer.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {plans.data?.map((p) => (
            <div key={p.id} className="card p-5">
              <span className="badge bg-brand-100 text-brand-700 capitalize">{p.period}</span>
              <h3 className="font-semibold mt-2">{p.name}</h3>
              <p className="text-sm text-neutral-600 mt-1">{p.description}</p>
              <p className="text-lg font-bold mt-3">{formatMoney(p.price, p.currency)}</p>
              <p className="text-xs text-neutral-500">{p.meals_per_period} meals</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Active subscribers</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Meals left</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.data?.map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3">{s.profiles?.full_name ?? s.profiles?.email}</td>
                  <td className="px-4 py-3">{s.meal_plans?.name}</td>
                  <td className="px-4 py-3">{s.start_date} → {s.end_date}</td>
                  <td className="px-4 py-3">{s.meals_remaining}</td>
                  <td className="px-4 py-3 capitalize">{s.status}</td>
                </tr>
              ))}
              {!subs.data?.length && <tr><td colSpan={5} className="p-10 text-center text-neutral-500">No subscribers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
