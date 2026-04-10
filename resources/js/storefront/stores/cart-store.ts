import { create } from 'zustand';
import { storefrontFetch } from '../lib/fetch-client';

export interface CartItem {
    id: number;
    name: string;
    variant_name: string | null;
    price: number;
    quantity: number;
    image: string | null;
    max_quantity: number | null;
}

export interface CartSummary {
    item_count: number;
    subtotal: number;
    total: number;
}

interface CartResponse {
    items: CartItem[];
    summary: CartSummary;
}

interface CartState {
    shopSlug: string;
    items: CartItem[];
    summary: CartSummary;
    isOpen: boolean;
    isLoading: boolean;
    hasFetched: boolean;

    initialize: (shopSlug: string, summary: CartSummary) => void;
    fetchCart: (force?: boolean) => Promise<void>;
    addItem: (variantId: number, quantity?: number) => Promise<{ ok: boolean; message?: string }>;
    updateItem: (itemId: number, quantity: number) => void;
    removeItem: (itemId: number) => void;
    openDrawer: () => void;
    closeDrawer: () => void;
}

const pendingUpdates = new Map<number, ReturnType<typeof setTimeout>>();

function recomputeSummary(items: CartItem[]): CartSummary {
    return {
        item_count: items.length,
        subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
}

export const useCartStore = create<CartState>((set, get) => ({
    shopSlug: '',
    items: [],
    summary: { item_count: 0, subtotal: 0, total: 0 },
    isOpen: false,
    isLoading: false,
    hasFetched: false,

    initialize: (shopSlug, summary) => {
        set({ shopSlug, summary });
    },

    fetchCart: async (force = false) => {
        const { shopSlug, hasFetched, isLoading } = get();
        if (!shopSlug || isLoading || (hasFetched && !force)) return;

        set({ isLoading: true });
        const res = await storefrontFetch<CartResponse>(`/store/${shopSlug}/api/cart`);
        if (res.ok && res.data) {
            set({
                items: res.data.items,
                summary: res.data.summary,
                isLoading: false,
                hasFetched: true,
            });
        } else {
            set({ isLoading: false, hasFetched: true });
        }
    },

    addItem: async (variantId, quantity = 1) => {
        const { shopSlug, items, summary } = get();

        set({
            summary: { ...summary, item_count: summary.item_count + 1 },
            hasFetched: false,
        });

        const res = await storefrontFetch<{ summary: CartSummary; message: string }>(
            `/store/${shopSlug}/api/cart`,
            { method: 'POST', json: { variant_id: variantId, quantity } },
        );

        if (res.ok && res.data?.summary) {
            set({ summary: res.data.summary, hasFetched: false });
            return { ok: true, message: res.data.message };
        }

        set({ summary, items });
        return { ok: false, message: res.data?.message ?? 'Failed to add to cart' };
    },

    updateItem: (itemId, quantity) => {
        const { shopSlug, items } = get();

        const updated = items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i,
        );
        set({ items: updated, summary: recomputeSummary(updated) });

        const existing = pendingUpdates.get(itemId);
        if (existing) clearTimeout(existing);

        pendingUpdates.set(
            itemId,
            setTimeout(async () => {
                pendingUpdates.delete(itemId);
                const res = await storefrontFetch<CartResponse>(
                    `/store/${shopSlug}/api/cart/${itemId}`,
                    { method: 'PATCH', json: { quantity } },
                );
                if (res.ok && res.data) {
                    set({ items: res.data.items, summary: res.data.summary });
                }
            }, 500),
        );
    },

    removeItem: (itemId) => {
        const { shopSlug, items } = get();

        const existing = pendingUpdates.get(itemId);
        if (existing) {
            clearTimeout(existing);
            pendingUpdates.delete(itemId);
        }

        const filtered = items.filter((i) => i.id !== itemId);
        set({ items: filtered, summary: recomputeSummary(filtered) });

        storefrontFetch<CartResponse>(
            `/store/${shopSlug}/api/cart/${itemId}`,
            { method: 'DELETE' },
        ).then((res) => {
            if (res.ok && res.data) {
                set({ items: res.data.items, summary: res.data.summary });
            }
        });
    },

    openDrawer: () => {
        set({ isOpen: true });
        const { hasFetched } = get();
        if (!hasFetched) {
            get().fetchCart();
        }
    },

    closeDrawer: () => {
        set({ isOpen: false });
    },
}));
