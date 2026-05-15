import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MenuItemCard } from '@/components/menu-item-card';

export default async function DailyMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!restaurant) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const { data: daily } = await supabase
    .from('daily_menus')
    .select('*, daily_menu_items(menu_item_id, override_price, sort_order, menu_items(*))')
    .eq('restaurant_id', restaurant.id)
    .eq('menu_date', today)
    .eq('is_published', true)
    .single();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Today's Menu</h2>
        <p className="text-neutral-600">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {!daily ? (
        <div className="card p-10 text-center text-neutral-500">
          No daily menu published for today yet. Check back soon or browse the full menu.
        </div>
      ) : (
        <>
          {daily.title && <h3 className="text-lg font-semibold mb-4">{daily.title}</h3>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(daily.daily_menu_items ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((dmi: any) => (
                <MenuItemCard
                  key={dmi.menu_item_id}
                  item={{ ...dmi.menu_items, price: dmi.override_price ?? dmi.menu_items.price }}
                  restaurantId={restaurant.id}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
