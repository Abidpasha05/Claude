import { createClient } from '@/lib/supabase/server';
import { DailyMenuEditor } from './daily-menu-editor';

export default async function AdminDailyMenuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const today = new Date().toISOString().slice(0, 10);

  const [items, dailies] = await Promise.all([
    supabase.from('menu_items').select('id, name, price, currency').eq('restaurant_id', m!.restaurant_id).order('name'),
    supabase.from('daily_menus').select('*, daily_menu_items(menu_item_id)').eq('restaurant_id', m!.restaurant_id).gte('menu_date', today).order('menu_date'),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Daily Menu</h1>
      <p className="text-neutral-600 mb-6">Schedule which items appear on the customer-facing daily menu and trigger notifications.</p>
      <DailyMenuEditor
        restaurantId={m!.restaurant_id}
        items={items.data ?? []}
        dailies={dailies.data ?? []}
      />
    </div>
  );
}
