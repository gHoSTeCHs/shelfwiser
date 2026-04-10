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

interface CartState {
    shopSlug: string;
    items: CartItem[];
    summary: CartSummary;
    isOpen: boolean;
    isLoading: boolean;

    initialize: (shopSlug: string, summary: CartSummary) => void;
    fetchCart: () => Promise<void>;
    addItem: (variantId: number, quantity?: number) => Promise<{ ok: boolean; message?: string }>;
    updateItem: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    openDrawer: () => void;
    closeDrawer: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    shopSlug: '',
    items: [],
    summary: { item_count: 0, subtotal: 0, total: 0 },
    isOpen: false,
    isLoading: false,

    initialize: (shopSlug, summary) => {
        set({ shopSlug, summary });
    },

    fetchCart: async () => {
        const { shopSlug } = get();
        if (!shopSlug) return;

        set({ isLoading: true });
        const res = await storefrontFetch<{ items: CartItem[]; summary: CartSummary }>(
            `/store/${shopSlug}/api/cart`,
        );
        if (res.ok && res.data) {
            set({ items: res.data.items, summary: res.data.summary, isLoading: false });
        } else {
            set({ isLoading: false });
        }
    },

    addItem: async (variantId, quantity = 1) => {
        const { shopSlug } = get();
        const res = await storefrontFetch<{ summary: CartSummary; message: string }>(
            `/store/${shopSlug}/api/cart`,
            { method: 'POST', json: { variant_id: variantId, quantity } },
        );
        if (res.ok && res.data?.summary) {
            set({ summary: res.data.summary });
            return { ok: true, message: res.data.message };
        }
        return { ok: false, message: res.data?.message ?? 'Failed to add to cart' };
    },

    updateItem: async (itemId, quantity) => {
        const { shopSlug } = get();
        const res = await storefrontFetch<{ items: CartItem[]; summary: CartSummary }>(
            `/store/${shopSlug}/api/cart/${itemId}`,
            { method: 'PATCH', json: { quantity } },
        );
        if (res.ok && res.data) {
            set({ items: res.data.items, summary: res.data.summary });
        }
    },

    removeItem: async (itemId) => {
        const { shopSlug } = get();
        const res = await storefrontFetch<{ items: CartItem[]; summary: CartSummary }>(
            `/store/${shopSlug}/api/cart/${itemId}`,
            { method: 'DELETE' },
        );
        if (res.ok && res.data) {
            set({ items: res.data.items, summary: res.data.summary });
        }
    },

    openDrawer: () => {
        set({ isOpen: true });
        get().fetchCart();
    },

    closeDrawer: () => {
        set({ isOpen: false });
    },
}));
