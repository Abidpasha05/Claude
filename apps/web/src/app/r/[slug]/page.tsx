import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MenuItemCard } from '@/components/menu-item-card';

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, currency')
    .eq('slug', slug)
    .single();

  if (!restaurant) notFound();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .neq('status', 'hidden')
      .order('sort_order'),
  ]);

  const byCategory = new Map<string, typeof items>();
  for (const it of items ?? []) {
    if (!it.category_id) continue;
    if (!byCategory.has(it.category_id)) byCategory.set(it.category_id, []);
    byCategory.get(it.category_id)!.push(it);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {categories?.map((cat) => {
        const catItems = byCategory.get(cat.id) ?? [];
        if (!catItems.length) return null;
        return (
          <section key={cat.id} className="mb-10">
            <h2 className="text-xl font-bold mb-4">{cat.name}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catItems.map((it) => (
                <MenuItemCard key={it.id} item={it} restaurantId={restaurant.id} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
