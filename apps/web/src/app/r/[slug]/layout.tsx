import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CartBadge } from '@/components/cart-badge';

export default async function RestaurantLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!restaurant) notFound();

  const base = `/r/${slug}`;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-neutral-500 hover:underline">← All restaurants</Link>
            <h1 className="font-bold text-lg">{restaurant.name}</h1>
          </div>
          <CartBadge restaurantSlug={slug} />
        </div>
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto text-sm">
          <Tab href={`${base}`} label="Menu" />
          <Tab href={`${base}/daily`} label="Today's Menu" />
          <Tab href={`${base}/specials`} label="Weekly Specials" />
          <Tab href={`${base}/book`} label="Book Table" />
          <Tab href={`${base}/party`} label="Party Orders" />
          <Tab href={`${base}/subscriptions`} label="Meal Plans" />
          <Tab href={`${base}/promotions`} label="Offers" />
          <Tab href={`${base}/feedback`} label="Feedback" />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

function Tab({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="px-3 py-2 whitespace-nowrap hover:text-brand-700 hover:bg-brand-50 rounded-t-md">
      {label}
    </Link>
  );
}
