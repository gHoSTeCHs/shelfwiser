import {
    deleteItem,
    getItem,
    getItemsByIndex,
    getPendingActions,
    putItem,
    queueOfflineAction,
} from '@/lib/indexeddb';
import { OfflineOrder, POSCart, POSCartItem, SyncProduct } from '@/types/sync';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseOfflinePOSOptions {
    shopId: number;
    tenantId: number;
    onOrderSynced?: (offlineId: string, orderId: number, orderNumber: string) => void;
    onSyncError?: (offlineId: string, error: string) => void;
}

interface UseOfflinePOSReturn {
    // Cart management
    cart: POSCartItem[];
    addToCart: (product: SyncProduct) => void;
    updateQuantity: (variantId: number, quantity: number) => void;
    removeFromCart: (variantId: number) => void;
    clearCart: () => void;
    setCart: (items: POSCartItem[]) => void;

    // Offline orders
    completeSale: (options: CompleteSaleOptions) => Promise<CompleteSaleResult>;
    pendingOrdersCount: number;
    syncPendingOrders: () => Promise<void>;
    isSyncing: boolean;

    // Status
    isOnline: boolean;
    isCartLoaded: boolean;
}

interface CompleteSaleOptions {
    customerId: number | null;
    paymentMethod: string;
    amountTendered: number;
    discount: number;
    notes: string;
    taxRate: number;
    taxEnabled: boolean;
}

interface CompleteSaleResult {
    success: boolean;
    isOffline: boolean;
    offlineId?: string;
    orderId?: number;
    orderNumber?: string;
    error?: string;
}

const CART_KEY_PREFIX = 'pos_cart_';

/**
 * Hook for managing offline-capable POS operations.
 *
 * - Persists cart to IndexedDB
 * - Queues orders when offline
 * - Syncs orders when back online
 */
export function useOfflinePOS(options: UseOfflinePOSOptions): UseOfflinePOSReturn {
    const { shopId, tenantId, onOrderSynced, onSyncError } = options;

    const [cart, setCartState] = useState<POSCartItem[]>([]);
    const [isCartLoaded, setIsCartLoaded] = useState(false);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const isMountedRef = useRef(true);
    const cartId = `${CART_KEY_PREFIX}${shopId}`;

    // Sync pending orders - defined early so it can be used by online/offline handlers
    const syncPendingOrders = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);

        try {
            const pending = await getPendingActions();
            const orderActions = pending.filter(a => a.entity === 'offline_order' && !a.synced);

            if (orderActions.length === 0) {
                return;
            }

            console.log(`[useOfflinePOS] Syncing ${orderActions.length} pending orders`);

            // Batch sync orders
            const orders = orderActions.map(a => a.data as OfflineOrder);

            const response = await fetch('/api/sync/orders', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({ orders }),
            });

            if (response.ok) {
                const result = await response.json();

                // Process results
                for (const syncResult of result.results || []) {
                    const action = orderActions.find(a => (a.data as OfflineOrder).offline_id === syncResult.offline_id);

                    if (action && action.id !== undefined) {
                        if (syncResult.success) {
                            // Mark as synced
                            const updatedAction = { ...action, synced: true };
                            await putItem('offlineQueue', updatedAction);
                            onOrderSynced?.(syncResult.offline_id, syncResult.order_id, syncResult.order_number);
                        } else {
                            // Update with error
                            const updatedAction = {
                                ...action,
                                retries: action.retries + 1,
                                lastError: syncResult.message,
                            };
                            await putItem('offlineQueue', updatedAction);
                            onSyncError?.(syncResult.offline_id, syncResult.message);
                        }
                    }
                }

                // Update pending count
                const remaining = await getPendingActions();
                const remainingOrders = remaining.filter(a => a.entity === 'offline_order' && !a.synced);
                if (isMountedRef.current) {
                    setPendingOrdersCount(remainingOrders.length);
                }
            }
        } catch (error) {
            console.error('[useOfflinePOS] Sync error:', error);
        } finally {
            if (isMountedRef.current) {
                setIsSyncing(false);
            }
        }
    }, [isOnline, isSyncing, onOrderSynced, onSyncError]);

    // Update online status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Auto-sync when coming online
            syncPendingOrders();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncPendingOrders]);

    // Load cart from IndexedDB on mount
    useEffect(() => {
        const loadCart = async () => {
            try {
                const savedCart = await getItem<POSCart>('cart', cartId);
                if (savedCart && isMountedRef.current) {
                    setCartState(savedCart.items || []);
                }
            } catch (error) {
                console.error('[useOfflinePOS] Failed to load cart:', error);
            } finally {
                if (isMountedRef.current) {
                    setIsCartLoaded(true);
                }
            }
        };

        loadCart();
    }, [cartId]);

    // Save cart to IndexedDB whenever it changes
    useEffect(() => {
        if (!isCartLoaded) return;

        const saveCart = async () => {
            try {
                const cartData: POSCart = {
                    id: cartId,
                    shop_id: shopId,
                    items: cart,
                    customer_id: null,
                    discount: 0,
                    notes: '',
                    updated_at: Date.now(),
                };
                await putItem('cart', cartData);
            } catch (error) {
                console.error('[useOfflinePOS] Failed to save cart:', error);
            }
        };

        saveCart();
    }, [cart, cartId, shopId, isCartLoaded]);

    // Load pending orders count
    useEffect(() => {
        const loadPendingCount = async () => {
            try {
                const pending = await getPendingActions();
                const orderActions = pending.filter(a => a.entity === 'offline_order');
                if (isMountedRef.current) {
                    setPendingOrdersCount(orderActions.length);
                }
            } catch (error) {
                console.error('[useOfflinePOS] Failed to load pending count:', error);
            }
        };

        loadPendingCount();

        // Refresh count periodically
        const interval = setInterval(loadPendingCount, 10000);
        return () => clearInterval(interval);
    }, []);

    // Add product to cart
    const addToCart = useCallback((product: SyncProduct) => {
        setCartState(prevCart => {
            const existingIndex = prevCart.findIndex(item => item.variant_id === product.id);

            if (existingIndex >= 0) {
                // Increment quantity
                const newCart = [...prevCart];
                newCart[existingIndex] = {
                    ...newCart[existingIndex],
                    quantity: newCart[existingIndex].quantity + 1,
                };
                return newCart;
            }

            // Add new item
            return [
                ...prevCart,
                {
                    variant_id: product.id,
                    name: product.display_name || product.product_name,
                    sku: product.sku,
                    barcode: product.barcode,
                    quantity: 1,
                    unit_price: product.price,
                },
            ];
        });
    }, []);

    // Update item quantity
    const updateQuantity = useCallback((variantId: number, quantity: number) => {
        if (quantity <= 0) {
            setCartState(prevCart => prevCart.filter(item => item.variant_id !== variantId));
        } else {
            setCartState(prevCart =>
                prevCart.map(item =>
                    item.variant_id === variantId
                        ? { ...item, quantity }
                        : item
                )
            );
        }
    }, []);

    // Remove item from cart
    const removeFromCart = useCallback((variantId: number) => {
        setCartState(prevCart => prevCart.filter(item => item.variant_id !== variantId));
    }, []);

    // Clear cart
    const clearCart = useCallback(async () => {
        setCartState([]);
        try {
            await deleteItem('cart', cartId);
        } catch (error) {
            console.error('[useOfflinePOS] Failed to clear cart:', error);
        }
    }, [cartId]);

    // Set cart items directly
    const setCart = useCallback((items: POSCartItem[]) => {
        setCartState(items);
    }, []);

    // Complete sale (online or offline)
    const completeSale = useCallback(async (saleOptions: CompleteSaleOptions): Promise<CompleteSaleResult> => {
        if (cart.length === 0) {
            return { success: false, isOffline: false, error: 'Cart is empty' };
        }

        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
        const taxAmount = saleOptions.taxEnabled ? subtotal * (saleOptions.taxRate / 100) : 0;
        const totalAmount = subtotal + taxAmount - saleOptions.discount;

        // Generate offline ID
        const offlineId = `OFFLINE-${shopId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const offlineOrder: OfflineOrder = {
            offline_id: offlineId,
            shop_id: shopId,
            items: cart.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                packaging_type_id: item.packaging_type_id,
                discount_amount: item.discount_amount,
            })),
            customer_id: saleOptions.customerId,
            payment_method: saleOptions.paymentMethod,
            amount_tendered: saleOptions.amountTendered,
            discount_amount: saleOptions.discount,
            notes: saleOptions.notes || null,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            created_at: new Date().toISOString(),
        };

        // If online, try direct API call
        if (isOnline) {
            try {
                const response = await fetch(`/pos/${shopId}/complete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                    },
                    body: JSON.stringify({
                        items: JSON.stringify(cart.map(item => ({
                            variant_id: item.variant_id,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                        }))),
                        customer_id: saleOptions.customerId || '',
                        payment_method: saleOptions.paymentMethod,
                        amount_tendered: saleOptions.amountTendered,
                        discount_amount: saleOptions.discount,
                        notes: saleOptions.notes || '',
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    await clearCart();
                    return {
                        success: true,
                        isOffline: false,
                        orderId: data.order?.id,
                        orderNumber: data.order?.order_number,
                    };
                }

                // If server error, fall through to offline queue
                console.warn('[useOfflinePOS] Server error, queuing offline:', response.status);
            } catch (error) {
                console.warn('[useOfflinePOS] Network error, queuing offline:', error);
            }
        }

        // Queue for offline sync
        try {
            await queueOfflineAction({
                type: 'create',
                entity: 'offline_order',
                data: offlineOrder,
                url: '/api/sync/orders',
                method: 'POST',
            });

            await clearCart();
            setPendingOrdersCount(prev => prev + 1);

            return {
                success: true,
                isOffline: true,
                offlineId,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to queue order';
            return { success: false, isOffline: true, error: message };
        }
    }, [cart, shopId, isOnline, clearCart]);

    // Cleanup
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setCart,
        completeSale,
        pendingOrdersCount,
        syncPendingOrders,
        isSyncing,
        isOnline,
        isCartLoaded,
    };
}

export default useOfflinePOS;
