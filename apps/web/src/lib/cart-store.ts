'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine } from '@restaurant-saas/shared';

interface CartState {
  restaurant_id: string | null;
  lines: CartLine[];
  add: (restaurant_id: string, line: CartLine) => void;
  remove: (menu_item_id: string) => void;
  setQty: (menu_item_id: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant_id: null,
      lines: [],
      add: (restaurant_id, line) => {
        const state = get();
        // Switching restaurant clears cart (single-restaurant-per-cart rule)
        if (state.restaurant_id && state.restaurant_id !== restaurant_id) {
          set({ restaurant_id, lines: [line] });
          return;
        }
        const existing = state.lines.find((l) => l.menu_item_id === line.menu_item_id);
        if (existing) {
          set({
            restaurant_id,
            lines: state.lines.map((l) =>
              l.menu_item_id === line.menu_item_id
                ? { ...l, quantity: l.quantity + line.quantity }
                : l
            ),
          });
        } else {
          set({ restaurant_id, lines: [...state.lines, line] });
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
      clear: () => set({ restaurant_id: null, lines: [] }),
      count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    { name: 'cart' }
  )
);
