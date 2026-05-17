'use client';

import { Flame, Leaf, WheatOff } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { formatMoney } from '@arkan/shared';

interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  calories: number | null;
  status: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_spicy: boolean;
  images: string[] | null;
}

export function MenuItemCard({ item, restaurantId }: { item: Item; restaurantId: string }) {
  const add = useCart((s) => s.add);
  const oos = item.status === 'out_of_stock';

  return (
    <div className="card overflow-hidden flex flex-col">
      {item.images?.[0] && (
        <div className="aspect-video bg-neutral-200">
          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{item.name}</h3>
          <span className="font-semibold whitespace-nowrap">
            {formatMoney(item.price, item.currency)}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-3 text-xs">
          {item.calories != null && (
            <span className="badge bg-neutral-100 text-neutral-700">{item.calories} kcal</span>
          )}
          {item.is_vegetarian && <span className="badge bg-green-100 text-green-700"><Leaf className="w-3 h-3 mr-0.5" />Veg</span>}
          {item.is_gluten_free && <span className="badge bg-amber-100 text-amber-700"><WheatOff className="w-3 h-3 mr-0.5" />GF</span>}
          {item.is_spicy && <span className="badge bg-red-100 text-red-700"><Flame className="w-3 h-3 mr-0.5" />Spicy</span>}
        </div>
        <button
          disabled={oos}
          onClick={() =>
            add(restaurantId, {
              menu_item_id: item.id,
              name: item.name,
              unit_price: item.price,
              quantity: 1,
            })
          }
          className="mt-4 btn-primary w-full"
        >
          {oos ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
