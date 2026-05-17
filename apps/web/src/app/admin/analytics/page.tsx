import { createClient } from '@/lib/supabase/server';
import { AnalyticsView } from './analytics-view';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = Math.max(1, Math.min(365, Number(sp.days ?? 30)));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id, restaurants(currency, name)')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const rid = m!.restaurant_id;
  const currency = (m as any).restaurants?.currency ?? 'SAR';

  const [summary, daily, bestSellers, peakHours, breakdowns] = await Promise.all([
    supabase.rpc('restaurant_summary', { p_restaurant_id: rid, p_days: days }),
    supabase.rpc('restaurant_revenue_by_day', { p_restaurant_id: rid, p_days: days }),
    supabase.rpc('restaurant_best_sellers', { p_restaurant_id: rid, p_days: days, p_limit: 10 }),
    supabase.rpc('restaurant_peak_hours', { p_restaurant_id: rid, p_days: days }),
    supabase.rpc('restaurant_breakdowns', { p_restaurant_id: rid, p_days: days }),
  ]);

  return (
    <AnalyticsView
      days={days}
      currency={currency}
      summary={summary.data?.[0] ?? null}
      daily={daily.data ?? []}
      bestSellers={bestSellers.data ?? []}
      peakHours={peakHours.data ?? []}
      breakdowns={breakdowns.data ?? []}
    />
  );
}
