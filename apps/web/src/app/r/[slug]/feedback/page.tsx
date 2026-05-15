import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FeedbackForm } from './feedback-form';

export default async function FeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('slug', slug)
    .single();
  if (!restaurant) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Complaints & Suggestions</h1>
      <p className="text-neutral-600 mb-6">
        Help us improve. We respond to every message within 48 hours.
      </p>
      <FeedbackForm restaurantId={restaurant.id} />
    </div>
  );
}
