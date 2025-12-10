import {
    getLastSyncTime,
    getProductCountForShop,
    putItems,
    searchProducts,
    setLastSyncTime,
} from '@/lib/indexeddb';
import { SyncProduct } from '@/types/sync';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseOfflineProductsOptions {
    shopId: number;
    tenantId: number;
    autoSync?: boolean;
    syncIntervalMs?: number; // How often to sync (default: 5 minutes)
}

interface UseOfflineProductsReturn {
    // Search
    searchProducts: (query: string) => Promise<SyncProduct[]>;
    isSearching: boolean;

    // Sync
    syncProducts: () => Promise<void>;
    isSyncing: boolean;
    lastSyncTime: number | null;
    productCount: number;
    syncError: string | null;

    // Status
    isOnline: boolean;
    isReady: boolean;
}

/**
 * Hook for managing offline product data.
 *
 * - Syncs products from server to IndexedDB
 * - Provides fast local search (IndexedDB first, API fallback)
 * - Auto-syncs periodically when online
 */
export function useOfflineProducts(options: UseOfflineProductsOptions): UseOfflineProductsReturn {
    const {
        shopId,
        tenantId,
        autoSync = true,
        syncIntervalMs = 5 * 60 * 1000, // 5 minutes
    } = options;

    const [isSearching, setIsSearching] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTimeState] = useState<number | null>(null);
    const [productCount, setProductCount] = useState(0);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [isReady, setIsReady] = useState(false);

    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Update online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Sync products from server to IndexedDB
    const syncProducts = useCallback(async () => {
        if (!isOnline) {
            console.log('[useOfflineProducts] Skipping sync - offline');
            return;
        }

        if (isSyncing) {
            console.log('[useOfflineProducts] Sync already in progress');
            return;
        }

        setIsSyncing(true);
        setSyncError(null);

        try {
            // Get last sync time for incremental sync
            const lastSync = await getLastSyncTime(`products_${shopId}`);

            // Build API URL
            let url = `/api/sync/products?shop_id=${shopId}`;
            if (lastSync) {
                url += `&updated_since=${new Date(lastSync).toISOString()}`;
            }

            console.log('[useOfflineProducts] Syncing products from:', url);

            const response = await fetch(url, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const products: SyncProduct[] = result.data || [];

            console.log(`[useOfflineProducts] Received ${products.length} products`);

            if (products.length > 0) {
                // Store in IndexedDB
                await putItems('products', products);
            }

            // Update sync metadata
            await setLastSyncTime(`products_${shopId}`);
            const newSyncTime = Date.now();

            if (isMountedRef.current) {
                setLastSyncTimeState(newSyncTime);

                // Update product count
                const count = await getProductCountForShop(shopId);
                setProductCount(count);
            }

            console.log('[useOfflineProducts] Sync complete');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to sync products';
            console.error('[useOfflineProducts] Sync error:', message);

            if (isMountedRef.current) {
                setSyncError(message);
            }
        } finally {
            if (isMountedRef.current) {
                setIsSyncing(false);
            }
        }
    }, [shopId, isOnline, isSyncing]);

    // Search products (IndexedDB first, API fallback)
    const searchProductsLocal = useCallback(async (query: string): Promise<SyncProduct[]> => {
        if (!query || query.length < 1) {
            return [];
        }

        setIsSearching(true);

        try {
            // First, try IndexedDB (with tenant scoping for security)
            const localResults = await searchProducts<SyncProduct>(query, shopId, tenantId, 20);

            if (localResults.length > 0) {
                console.log(`[useOfflineProducts] Found ${localResults.length} products locally`);
                return localResults;
            }

            // If offline or no local results, try API as fallback
            if (isOnline) {
                console.log('[useOfflineProducts] No local results, trying API...');

                const response = await fetch(
                    `/pos/${shopId}/search/products?query=${encodeURIComponent(query)}`,
                    {
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const products = data.products || [];

                    // Convert API response to SyncProduct format and cache
                    const syncProducts: SyncProduct[] = products.map((p: any) => ({
                        id: p.id,
                        product_id: p.product?.id || p.product_id,
                        tenant_id: tenantId,
                        shop_id: shopId,
                        product_name: p.product?.name || p.name,
                        variant_name: p.name,
                        display_name: `${p.product?.name || ''} ${p.name ? '- ' + p.name : ''}`.trim(),
                        sku: p.sku,
                        barcode: p.barcode,
                        price: parseFloat(p.price) || 0,
                        cost_price: parseFloat(p.cost_price) || 0,
                        stock_quantity: p.stock_quantity || 0,
                        available_stock: p.available_stock || p.stock_quantity || 0,
                        track_stock: p.track_stock ?? true,
                        reorder_level: p.reorder_level,
                        is_taxable: p.product?.is_taxable || false,
                        is_active: p.is_active ?? true,
                        image_url: p.image_url,
                        packaging_types: p.packagingTypes || [],
                        updated_at: p.updated_at || new Date().toISOString(),
                    }));

                    // Cache new products in IndexedDB
                    if (syncProducts.length > 0) {
                        await putItems('products', syncProducts);
                    }

                    return syncProducts;
                }
            }

            return [];
        } catch (error) {
            console.error('[useOfflineProducts] Search error:', error);
            return [];
        } finally {
            if (isMountedRef.current) {
                setIsSearching(false);
            }
        }
    }, [shopId, tenantId, isOnline]);

    // Initialize: load sync time and product count
    useEffect(() => {
        const init = async () => {
            try {
                const syncTime = await getLastSyncTime(`products_${shopId}`);
                const count = await getProductCountForShop(shopId);

                if (isMountedRef.current) {
                    setLastSyncTimeState(syncTime);
                    setProductCount(count);
                    setIsReady(true);
                }
            } catch (error) {
                console.error('[useOfflineProducts] Init error:', error);
                if (isMountedRef.current) {
                    setIsReady(true);
                }
            }
        };

        init();
    }, [shopId]);

    // Auto-sync on mount and when coming online
    useEffect(() => {
        if (!autoSync || !isReady) return;

        // Sync immediately if we have no products or haven't synced recently
        const shouldSyncNow = productCount === 0 ||
            !lastSyncTime ||
            (Date.now() - lastSyncTime > syncIntervalMs);

        if (shouldSyncNow && isOnline) {
            syncProducts();
        }
    }, [autoSync, isReady, isOnline, productCount, lastSyncTime, syncIntervalMs, syncProducts]);

    // Set up periodic sync
    useEffect(() => {
        if (!autoSync) return;

        syncIntervalRef.current = setInterval(() => {
            if (isOnline && !isSyncing) {
                syncProducts();
            }
        }, syncIntervalMs);

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [autoSync, syncIntervalMs, isOnline, isSyncing, syncProducts]);

    // Cleanup
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        searchProducts: searchProductsLocal,
        isSearching,
        syncProducts,
        isSyncing,
        lastSyncTime,
        productCount,
        syncError,
        isOnline,
        isReady,
    };
}

export default useOfflineProducts;
