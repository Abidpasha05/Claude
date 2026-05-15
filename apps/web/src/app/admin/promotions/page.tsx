import { createClient } from '@/lib/supabase/server';
import { PromotionsManager } from './promotions-manager';

export default async function AdminPromotionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .eq('restaurant_id', m!.restaurant_id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Promotions</h1>
      <p className="text-neutral-600 mb-6">Closing-hour offers, codes, happy-hour discounts.</p>
      <PromotionsManager restaurantId={m!.restaurant_id} promotions={promotions ?? []} />
    </div>
  );
}
