import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { TrackingView } from './tracking-view';

export const dynamic = 'force-dynamic';

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await createAdminClient();

  const [{ data: order }, { data: history }] = await Promise.all([
    admin
      .from('orders')
      .select('*, order_items(*), restaurants(name, slug)')
      .eq('id', id)
      .single(),
    admin
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!order) notFound();

  return (
    <TrackingView
      initialOrder={order}
      initialHistory={history ?? []}
    />
  );
}
