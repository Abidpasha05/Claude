import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await createAdminClient();
  const { data } = await admin
    .from('reservations')
    .select('*, restaurants(name), restaurant_branches(name, address)')
    .eq('id', id)
    .single();

  if (!data) notFound();

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="card p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl mb-3">✓</div>
        <h1 className="text-2xl font-bold">Reservation confirmed</h1>
        <p className="text-neutral-600 mt-1">{(data as any).restaurants?.name}</p>
        <p className="text-neutral-600 text-sm">{(data as any).restaurant_branches?.name}</p>
        <div className="border-t mt-6 pt-4 text-left space-y-2 text-sm">
          <p><strong>Arrival:</strong> {new Date(data.arrival_time).toLocaleString()}</p>
          <p><strong>Party size:</strong> {data.party_size}</p>
          <p><strong>Status:</strong> {data.status}</p>
        </div>
      </div>
    </div>
  );
}
