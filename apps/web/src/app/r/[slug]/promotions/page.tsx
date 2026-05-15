import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PromotionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('slug', slug)
    .single();
  if (!restaurant) notFound();

  const { data: promos } = await supabase
    .from('promotions')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Offers & Promotions</h1>
      {!promos?.length ? (
        <div className="card p-10 text-center text-neutral-500">No active offers right now.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {promos.map((p) => (
            <div key={p.id} className="card p-5">
              {p.banner_image_url && (
                <img src={p.banner_image_url} className="rounded-lg mb-3 max-h-40 object-cover w-full" alt="" />
              )}
              <span className={`badge ${p.promotion_type === 'closing_hour' ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700'}`}>
                {p.promotion_type.replace('_', ' ')}
              </span>
              <h3 className="font-semibold mt-2">{p.title}</h3>
              {p.description && <p className="text-sm text-neutral-600 mt-1">{p.description}</p>}
              {p.code && (
                <p className="mt-3 text-sm">
                  Use code <span className="font-mono font-semibold">{p.code}</span>
                </p>
              )}
              {p.daily_start_time && p.daily_end_time && (
                <p className="text-xs text-neutral-500 mt-2">
                  Available daily from {p.daily_start_time.slice(0,5)} to {p.daily_end_time.slice(0,5)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
