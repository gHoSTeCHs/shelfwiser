/**
 * IndexedDB Utilities for ShelfWiser PWA
 *
 * Provides a simple interface for storing and retrieving data
 * in IndexedDB for offline support and data persistence.
 */

const DB_NAME = 'shelfwiser';
const DB_VERSION = 1;

/**
 * Cache expiration time: 24 hours in milliseconds
 */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Wrapper for cached data with timestamp
 */
interface CachedData<T> {
    data: T;
    cachedAt: number;
}

/**
 * Check if cached data is expired based on TTL
 */
function isExpired(cachedAt: number, ttl: number = CACHE_TTL): boolean {
    return Date.now() - cachedAt > ttl;
}

/**
 * Store definitions for IndexedDB
 */
interface StoreConfig {
    name: string;
    keyPath: string;
    indexes?: Array<{
        name: string;
        keyPath: string | string[];
        options?: IDBIndexParameters;
    }>;
}

const STORES: StoreConfig[] = [
    {
        name: 'products',
        keyPath: 'id',
        indexes: [
            { name: 'tenant_id', keyPath: 'tenant_id' },
            { name: 'shop_id', keyPath: 'shop_id' },
            { name: 'sku', keyPath: 'sku' },
            { name: 'barcode', keyPath: 'barcode' },
            { name: 'product_name', keyPath: 'product_name' },
        ],
    },
    {
        name: 'customers',
        keyPath: 'id',
        indexes: [
            { name: 'tenant_id', keyPath: 'tenant_id' },
            { name: 'email', keyPath: 'email', options: { unique: true } },
        ],
    },
    {
        name: 'orders',
        keyPath: 'id',
        indexes: [
            { name: 'tenant_id', keyPath: 'tenant_id' },
            { name: 'shop_id', keyPath: 'shop_id' },
            { name: 'order_number', keyPath: 'order_number' },
            { name: 'status', keyPath: 'status' },
        ],
    },
    {
        name: 'cart',
        keyPath: 'id',
        indexes: [{ name: 'shop_id', keyPath: 'shop_id' }],
    },
    {
        name: 'offlineQueue',
        keyPath: 'id',
        indexes: [
            { name: 'timestamp', keyPath: 'timestamp' },
            { name: 'type', keyPath: 'type' },
            { name: 'synced', keyPath: 'synced' },
        ],
    },
    {
        name: 'syncMetadata',
        keyPath: 'key',
    },
];

/**
 * Open or create the IndexedDB database
 */
export function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error(
                '[IndexedDB] Failed to open database:',
                request.error,
            );
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            STORES.forEach((storeConfig) => {
                if (!db.objectStoreNames.contains(storeConfig.name)) {
                    const store = db.createObjectStore(storeConfig.name, {
                        keyPath: storeConfig.keyPath,
                        autoIncrement: storeConfig.keyPath === 'id',
                    });

                    storeConfig.indexes?.forEach((index) => {
                        store.createIndex(
                            index.name,
                            index.keyPath,
                            index.options,
                        );
                    });

                    console.log(
                        `[IndexedDB] Created store: ${storeConfig.name}`,
                    );
                }
            });
        };
    });
}

/**
 * Get a single item by key from a store
 */
export async function getItem<T>(
    storeName: string,
    key: IDBValidKey,
): Promise<T | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as T);
    });
}

/**
 * Get all items from a store
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as T[]);
    });
}

/**
 * Get items by index value
 */
export async function getItemsByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey,
): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as T[]);
    });
}

/**
 * Put (add or update) an item in a store
 */
export async function putItem<T>(
    storeName: string,
    item: T,
): Promise<IDBValidKey> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(item);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Put multiple items in a store
 */
export async function putItems<T>(
    storeName: string,
    items: T[],
): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        items.forEach((item) => {
            store.put(item);
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Delete an item from a store
 */
export async function deleteItem(
    storeName: string,
    key: IDBValidKey,
): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Clear all items from a store
 */
export async function clearStore(storeName: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

/**
 * Count items in a store
 */
export async function countItems(storeName: string): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.count();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Offline queue action types
 */
export interface OfflineAction {
    id?: number;
    type: 'create' | 'update' | 'delete';
    entity: string;
    data: unknown;
    url: string;
    method: string;
    headers?: Record<string, string>;
    timestamp: number;
    synced: boolean;
    retries: number;
    lastError?: string;
}

/**
 * Add an action to the offline queue
 */
export async function queueOfflineAction(
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'>,
): Promise<void> {
    const offlineAction: OfflineAction = {
        ...action,
        timestamp: Date.now(),
        synced: false,
        retries: 0,
    };

    await putItem('offlineQueue', offlineAction);
    console.log(
        '[IndexedDB] Queued offline action:',
        action.type,
        action.entity,
    );

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            if ('sync' in registration) {
                await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-offline-actions');
            }
        } catch (error) {
            console.warn('[IndexedDB] Background sync not available:', error);
        }
    }
}

/**
 * Get pending offline actions
 */
export async function getPendingActions(): Promise<OfflineAction[]> {
    const allActions = await getAllItems<OfflineAction>('offlineQueue');
    const pendingActions = allActions.filter((action) => !action.synced);
    return pendingActions.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Mark an offline action as synced
 */
export async function markActionSynced(actionId: number): Promise<void> {
    const action = await getItem<OfflineAction>('offlineQueue', actionId);
    if (action) {
        action.synced = true;
        await putItem('offlineQueue', action);
    }
}

/**
 * Update sync metadata
 */
export async function setSyncMetadata(key: string, value: unknown): Promise<void> {
    await putItem('syncMetadata', { key, value, updatedAt: Date.now() });
}

/**
 * Get sync metadata
 */
export async function getSyncMetadata(key: string): Promise<unknown> {
    const meta = await getItem<{ key: string; value: unknown }>(
        'syncMetadata',
        key,
    );
    return meta?.value;
}

/**
 * Get last sync timestamp for an entity
 */
export async function getLastSyncTime(entity: string): Promise<number | null> {
    const timestamp = await getSyncMetadata(`lastSync_${entity}`);
    return typeof timestamp === 'number' ? timestamp : null;
}

/**
 * Set last sync timestamp for an entity
 */
export async function setLastSyncTime(entity: string): Promise<void> {
    await setSyncMetadata(`lastSync_${entity}`, Date.now());
}

/**
 * Search products by barcode (exact match)
 * Filters by both shop_id and tenant_id for security
 */
export async function searchProductByBarcode<T>(
    barcode: string,
    shopId: number,
    tenantId?: number,
): Promise<T | undefined> {
    const products = await getItemsByIndex<
        T & { barcode: string | null; shop_id: number; tenant_id: number }
    >('products', 'barcode', barcode);
    return products.find(
        (p) =>
            p.shop_id === shopId &&
            (tenantId === undefined || p.tenant_id === tenantId),
    ) as T | undefined;
}

/**
 * Search products by SKU (exact match)
 * Filters by both shop_id and tenant_id for security
 */
export async function searchProductBySku<T>(
    sku: string,
    shopId: number,
    tenantId?: number,
): Promise<T | undefined> {
    const products = await getItemsByIndex<
        T & { sku: string; shop_id: number; tenant_id: number }
    >('products', 'sku', sku);
    return products.find(
        (p) =>
            p.shop_id === shopId &&
            (tenantId === undefined || p.tenant_id === tenantId),
    ) as T | undefined;
}

/**
 * Search products by name (partial match)
 * Filters by both shop_id and tenant_id for security
 */
export async function searchProductsByName<T>(
    query: string,
    shopId: number,
    tenantId?: number,
    limit: number = 20,
): Promise<T[]> {
    const allProducts = await getItemsByIndex<
        T & {
            product_name: string;
            display_name: string;
            shop_id: number;
            tenant_id: number;
        }
    >('products', 'shop_id', shopId);
    const lowerQuery = query.toLowerCase();

    return allProducts
        .filter(
            (p) =>
                (tenantId === undefined || p.tenant_id === tenantId) &&
                (p.product_name?.toLowerCase().includes(lowerQuery) ||
                    p.display_name?.toLowerCase().includes(lowerQuery)),
        )
        .slice(0, limit) as T[];
}

/**
 * Search products by any field (barcode, SKU, or name)
 * Returns matches in priority order: exact barcode > exact SKU > name contains
 * Filters by both shop_id and tenant_id for security
 */
export async function searchProducts<T>(
    query: string,
    shopId: number,
    tenantId?: number,
    limit: number = 20,
): Promise<T[]> {
    // First, try exact barcode match
    const barcodeMatch = await searchProductByBarcode<T>(
        query,
        shopId,
        tenantId,
    );
    if (barcodeMatch) {
        return [barcodeMatch];
    }

    // Then, try exact SKU match
    const skuMatch = await searchProductBySku<T>(query, shopId, tenantId);
    if (skuMatch) {
        return [skuMatch];
    }

    // Finally, search by name
    return searchProductsByName<T>(query, shopId, tenantId, limit);
}

/**
 * Get all products for a shop
 * Optionally filter by tenant_id for extra security
 */
export async function getProductsForShop<T>(
    shopId: number,
    tenantId?: number,
): Promise<T[]> {
    const products = await getItemsByIndex<T & { tenant_id: number }>(
        'products',
        'shop_id',
        shopId,
    );
    if (tenantId === undefined) {
        return products as T[];
    }
    return products.filter((p) => p.tenant_id === tenantId) as T[];
}

/**
 * Get product count for a shop
 */
export async function getProductCountForShop(shopId: number): Promise<number> {
    const products = await getItemsByIndex('products', 'shop_id', shopId);
    return products.length;
}

/**
 * Search customers by name, email, or phone
 * Filters by tenant_id for security
 */
export async function searchCustomers<T>(
    query: string,
    tenantId: number,
    limit: number = 10,
): Promise<T[]> {
    const allCustomers = await getItemsByIndex<
        T & {
            tenant_id: number;
            first_name: string;
            last_name: string;
            email: string;
            phone: string | null;
        }
    >('customers', 'tenant_id', tenantId);

    const lowerQuery = query.toLowerCase();

    return allCustomers
        .filter(
            (c) =>
                c.first_name?.toLowerCase().includes(lowerQuery) ||
                c.last_name?.toLowerCase().includes(lowerQuery) ||
                c.email?.toLowerCase().includes(lowerQuery) ||
                c.phone?.includes(query),
        )
        .slice(0, limit) as T[];
}

/**
 * Get all customers for a tenant
 */
export async function getCustomersForTenant<T>(tenantId: number): Promise<T[]> {
    return getItemsByIndex<T>('customers', 'tenant_id', tenantId);
}

/**
 * Get customer count for a tenant
 */
export async function getCustomerCountForTenant(
    tenantId: number,
): Promise<number> {
    const customers = await getItemsByIndex('customers', 'tenant_id', tenantId);
    return customers.length;
}

/**
 * Set cached data with timestamp for expiration tracking.
 * Stores data wrapped in CachedData structure with cachedAt timestamp.
 */
export async function setCachedItem<T>(
    storeName: string,
    key: string,
    data: T,
): Promise<void> {
    const cachedData: CachedData<T> = {
        data,
        cachedAt: Date.now(),
    };
    await setSyncMetadata(`cache_${storeName}_${key}`, cachedData);
}

/**
 * Get cached data with automatic expiration checking.
 * Returns null if data is expired or doesn't exist.
 */
export async function getCachedItem<T>(
    storeName: string,
    key: string,
    ttl: number = CACHE_TTL,
): Promise<T | null> {
    const cached = await getSyncMetadata(`cache_${storeName}_${key}`);

    if (!cached) {
        return null;
    }

    const cachedData = cached as CachedData<T>;

    if (isExpired(cachedData.cachedAt, ttl)) {
        console.log(`[IndexedDB] Cache expired for ${storeName}:${key}`);
        return null;
    }

    return cachedData.data;
}

/**
 * Clear expired cache entries from syncMetadata store.
 * Optionally specify a store name to only clear caches for that store.
 */
export async function clearExpiredCache(storeName?: string): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('syncMetadata', 'readwrite');
        const store = tx.objectStore('syncMetadata');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const allMetadata = getAllRequest.result as Array<{
                key: string;
                value: { cachedAt?: number } & Record<string, unknown>;
                updatedAt?: number;
            }>;
            let deletedCount = 0;

            const prefix = storeName ? `cache_${storeName}_` : 'cache_';

            allMetadata.forEach((meta) => {
                if (meta.key.startsWith(prefix) && meta.value?.cachedAt) {
                    if (isExpired(meta.value.cachedAt)) {
                        store.delete(meta.key);
                        deletedCount++;
                    }
                }
            });

            tx.oncomplete = () => {
                if (deletedCount > 0) {
                    console.log(
                        `[IndexedDB] Cleared ${deletedCount} expired cache entries`,
                    );
                }
                resolve(deletedCount);
            };
            tx.onerror = () => reject(tx.error);
        };

        getAllRequest.onerror = () => reject(getAllRequest.error);
    });
}

/**
 * Check if cache for an entity is expired based on last sync time.
 */
export async function isCacheExpired(
    entity: string,
    ttl: number = CACHE_TTL,
): Promise<boolean> {
    const lastSync = await getLastSyncTime(entity);
    if (!lastSync) {
        return true;
    }
    return isExpired(lastSync, ttl);
}

export default {
    openDB,
    getItem,
    getAllItems,
    getItemsByIndex,
    putItem,
    putItems,
    deleteItem,
    clearStore,
    countItems,
    queueOfflineAction,
    getPendingActions,
    markActionSynced,
    setSyncMetadata,
    getSyncMetadata,
    getLastSyncTime,
    setLastSyncTime,
    searchProductByBarcode,
    searchProductBySku,
    searchProductsByName,
    searchProducts,
    getProductsForShop,
    getProductCountForShop,
    searchCustomers,
    getCustomersForTenant,
    getCustomerCountForTenant,
    setCachedItem,
    getCachedItem,
    clearExpiredCache,
    isCacheExpired,
};
