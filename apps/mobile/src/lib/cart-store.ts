import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartLine } from '@aklio/shared';

interface CartState {
  restaurant_id: string | null;
  restaurant_slug: string | null;
  restaurant_name: string | null;
  restaurant_currency: string;
  lines: CartLine[];
  add: (
    restaurant: { id: string; slug: string; name: string; currency: string },
    line: CartLine
  ) => void;
  remove: (menu_item_id: string) => void;
  setQty: (menu_item_id: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant_id: null,
      restaurant_slug: null,
      restaurant_name: null,
      restaurant_currency: 'SAR',
      lines: [],
      add: (restaurant, line) => {
        const state = get();
        if (state.restaurant_id && state.restaurant_id !== restaurant.id) {
          // Switching restaurants — replace the cart wholesale.
          set({
            restaurant_id: restaurant.id,
            restaurant_slug: restaurant.slug,
            restaurant_name: restaurant.name,
            restaurant_currency: restaurant.currency,
            lines: [line],
          });
          return;
        }
        const existing = state.lines.find((l) => l.menu_item_id === line.menu_item_id);
        if (existing) {
          set({
            restaurant_id: restaurant.id,
            restaurant_slug: restaurant.slug,
            restaurant_name: restaurant.name,
            restaurant_currency: restaurant.currency,
            lines: state.lines.map((l) =>
              l.menu_item_id === line.menu_item_id
                ? { ...l, quantity: l.quantity + line.quantity }
                : l
            ),
          });
        } else {
          set({
            restaurant_id: restaurant.id,
            restaurant_slug: restaurant.slug,
            restaurant_name: restaurant.name,
            restaurant_currency: restaurant.currency,
            lines: [...state.lines, line],
          });
        }
      },
      remove: (id) =>
        set((s) => ({ lines: s.lines.filter((l) => l.menu_item_id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.menu_item_id === id ? { ...l, quantity: qty } : l))
            .filter((l) => l.quantity > 0),
        })),
      clear: () =>
        set({ restaurant_id: null, restaurant_slug: null, restaurant_name: null, lines: [] }),
      count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: () =>
        get().lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
