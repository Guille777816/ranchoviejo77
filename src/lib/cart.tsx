import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price_cents: number;
  image?: string;
  quantity: number;
  stock: number;
  variant?: string;
};

export function itemKey(i: { productId: string; variant?: string }) {
  return `${i.productId}::${i.variant ?? ""}`;
}

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "rvm_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
        else if (parsed && Array.isArray(parsed.items)) setItems(parsed.items);
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Only persist after hydration, so we never overwrite a saved cart with [].
  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  // Keep the cart in sync across tabs/windows.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);


  const add: CartContextType["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const key = itemKey(item);
      const existing = prev.find((i) => itemKey(i) === key);
      if (existing) {
        const next = Math.min(existing.quantity + qty, item.stock || 99);
        return prev.map((i) => (itemKey(i) === key ? { ...i, quantity: next } : i));
      }
      return [...prev, { ...item, quantity: Math.min(qty, item.stock || 99) }];
    });
  };

  const remove = (key: string) =>
    setItems((p) => p.filter((i) => itemKey(i) !== key));

  const setQty = (key: string, qty: number) =>
    setItems((p) =>
      p
        .map((i) =>
          itemKey(i) === key
            ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock || 99)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );

  const clear = () => setItems([]);

  const count = items.reduce((a, i) => a + i.quantity, 0);
  const subtotalCents = items.reduce((a, i) => a + i.price_cents * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, subtotalCents }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
