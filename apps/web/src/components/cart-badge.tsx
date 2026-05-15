'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart-store';

export function CartBadge({ restaurantSlug }: { restaurantSlug: string }) {
  const count = useCart((s) => s.count());
  return (
    <Link href={`/r/${restaurantSlug}/checkout`} className="relative btn-secondary">
      <ShoppingBag className="w-4 h-4 mr-2" />
      Cart
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
