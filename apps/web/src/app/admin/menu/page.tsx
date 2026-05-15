import { createClient } from '@/lib/supabase/server';
import { MenuEditor } from './menu-editor';

export default async function AdminMenuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', m!.restaurant_id)
    .order('sort_order');

  const { data: items } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', m!.restaurant_id)
    .order('sort_order');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Menu</h1>
      <MenuEditor
        restaurantId={m!.restaurant_id}
        categories={categories ?? []}
        items={items ?? []}
      />
    </div>
  );
}
