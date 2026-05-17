import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, CalendarDays, Users, Sparkles, MessageCircle, Settings, Bike, Monitor, BarChart3 } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in?next=/admin');

  const { data: memberships } = await supabase
    .from('restaurant_members')
    .select('restaurant_id, role, restaurants(id, name, slug)')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (!memberships?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="card p-8 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">No restaurant linked</h1>
          <p className="text-neutral-600 text-sm mb-4">
            You're signed in but not a member of any restaurant. Ask the owner to invite you, or register a new restaurant.
          </p>
          <Link href="/for-business" className="btn-primary">Register a restaurant</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-neutral-900 text-white flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-bold text-lg">Arkan</span>
            <span className="text-xs text-neutral-500" dir="rtl">أركان</span>
          </Link>
          <p className="text-[10px] text-neutral-500 leading-tight">From kitchen to customer, all in one.</p>
          <p className="text-xs text-neutral-400 mt-2">{(memberships[0] as any).restaurants?.name}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <NavItem href="/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <NavItem href="/admin/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
          <NavItem href="/admin/orders" icon={<ShoppingBag className="w-4 h-4" />} label="Orders" />
          <NavItem href="/admin/menu" icon={<UtensilsCrossed className="w-4 h-4" />} label="Menu" />
          <NavItem href="/admin/daily-menu" icon={<CalendarDays className="w-4 h-4" />} label="Daily Menu" />
          <NavItem href="/admin/specials" icon={<Sparkles className="w-4 h-4" />} label="Weekly Specials" />
          <NavItem href="/admin/reservations" icon={<CalendarDays className="w-4 h-4" />} label="Reservations" />
          <NavItem href="/admin/party-orders" icon={<Users className="w-4 h-4" />} label="Party Orders" />
          <NavItem href="/admin/drivers" icon={<Bike className="w-4 h-4" />} label="Drivers" />
          <NavItem href="/admin/subscriptions" icon={<Users className="w-4 h-4" />} label="Meal Subscriptions" />
          <NavItem href="/admin/promotions" icon={<Sparkles className="w-4 h-4" />} label="Promotions" />
          <NavItem href="/admin/feedback" icon={<MessageCircle className="w-4 h-4" />} label="Feedback" />
          <NavItem href="/admin/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
          <NavItem
            href={`/kds/${(memberships[0] as any).restaurants?.slug}`}
            icon={<Monitor className="w-4 h-4" />}
            label="Kitchen Display"
          />
        </nav>
        <div className="p-4 text-xs text-neutral-400 border-t border-neutral-800">
          Signed in as {user.email}
        </div>
      </aside>
      <main className="flex-1 bg-neutral-50">{children}</main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-neutral-800">
      {icon} {label}
    </Link>
  );
}
