import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from './settings-form';

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id, restaurants(*)')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsForm restaurant={(m as any).restaurants} />
    </div>
  );
}
