import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function RestaurantsPage() {
  const supabase = await createClient();
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, slug, name, name_ar, description, cover_image_url, cuisine_types, country_code, currency')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Restaurants</h1>
      <p className="text-neutral-600 mb-8">Discover and order from restaurants near you.</p>

      {!restaurants?.length ? (
        <div className="card p-10 text-center text-neutral-500">
          No restaurants yet. <Link href="/for-business" className="text-brand-700 underline">List yours</Link>.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <Link key={r.id} href={`/r/${r.slug}`} className="card hover:shadow-md transition overflow-hidden">
              <div className="aspect-video bg-neutral-200 relative">
                {r.cover_image_url && (
                  <img src={r.cover_image_url} alt={r.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{r.name}</h3>
                {r.description && (
                  <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{r.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {r.cuisine_types?.slice(0, 3).map((c: string) => (
                    <span key={c} className="badge bg-neutral-100 text-neutral-700">{c}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
