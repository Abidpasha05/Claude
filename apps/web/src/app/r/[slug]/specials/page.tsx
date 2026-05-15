import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MenuItemCard } from '@/components/menu-item-card';

export default async function SpecialsPage({
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

  // Find current week
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);

  const { data: special } = await supabase
    .from('weekly_specials')
    .select('*, weekly_special_items(menu_item_id, override_price, sort_order, menu_items(*))')
    .eq('restaurant_id', restaurant.id)
    .eq('week_start', weekStart)
    .eq('is_published', true)
    .single();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-2">Weekly Specials</h2>
      <p className="text-neutral-600 mb-6">Chef's picks for the week.</p>

      {!special ? (
        <div className="card p-10 text-center text-neutral-500">No weekly special right now.</div>
      ) : (
        <>
          {special.banner_image_url && (
            <img src={special.banner_image_url} alt="" className="w-full rounded-xl mb-6 max-h-64 object-cover" />
          )}
          {special.title && <h3 className="text-xl font-semibold mb-4">{special.title}</h3>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(special.weekly_special_items ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((wsi: any) => (
                <MenuItemCard
                  key={wsi.menu_item_id}
                  item={{ ...wsi.menu_items, price: wsi.override_price ?? wsi.menu_items.price }}
                  restaurantId={restaurant.id}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
