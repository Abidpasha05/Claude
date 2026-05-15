import { createClient } from '@/lib/supabase/server';
import { FeedbackRow } from './feedback-row';

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: items } = await supabase
    .from('feedback')
    .select('*, feedback_responses(*)')
    .eq('restaurant_id', m!.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Complaints & Suggestions</h1>
      <div className="space-y-3">
        {items?.map((f: any) => <FeedbackRow key={f.id} feedback={f} />)}
        {!items?.length && <div className="card p-10 text-center text-neutral-500">No feedback yet.</div>}
      </div>
    </div>
  );
}
