import { createClient } from '@/lib/supabase/server';

export default async function AdminSpecialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: specials } = await supabase
    .from('weekly_specials')
    .select('*, weekly_special_items(menu_item_id)')
    .eq('restaurant_id', m!.restaurant_id)
    .order('week_start', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Weekly Specials</h1>
      <p className="text-neutral-600 mb-6">Plan the week's featured items with photos, prices, and calorie info.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {specials?.map((s: any) => (
          <div key={s.id} className="card p-5">
            <h3 className="font-semibold">Week of {s.week_start}</h3>
            <p className="text-sm text-neutral-600">{s.title}</p>
            <p className="text-xs text-neutral-500 mt-2">{s.weekly_special_items?.length ?? 0} items</p>
            <span className={`badge mt-2 ${s.is_published ? 'bg-green-100 text-green-700' : 'bg-neutral-100'}`}>
              {s.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        ))}
        {!specials?.length && <div className="card p-10 text-center text-neutral-500 col-span-2">No specials configured.</div>}
      </div>
    </div>
  );
}
