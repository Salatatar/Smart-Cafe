import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  item_id: number;
  name: string;
  price: number;
  qty: number;
  toppings?: number[];
};

type CartState = {
  items: CartItem[];
  add: (item: {
    item_id: number;
    name: string;
    price: number;
    qty?: number;
    toppings?: number[];
  }) => void;
  remove: (item_id: number) => void;
  clear: () => void;
  total: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (incoming) =>
        set((state) => {
          const qty = incoming.qty ?? 1;
          const next = [...state.items];
          const idx = next.findIndex((x) => x.item_id === incoming.item_id);

          if (idx >= 0) {
            // ✅ ใช้วิธีปลอดภัย
            const item = next[idx];
            if (item) {
              next[idx] = { ...item, qty: item.qty + qty };
            }
            return { items: next };
          }

          return { items: [...state.items, { ...incoming, qty }] };
        }),

      remove: (item_id) =>
        set((state) => ({
          items: state.items.filter((i) => i.item_id !== item_id),
        })),

      clear: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: 'smartcafe-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
