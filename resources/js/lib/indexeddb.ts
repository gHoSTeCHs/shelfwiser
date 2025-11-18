/**
 * IndexedDB Utilities for ShelfWiser PWA
 *
 * Provides a simple interface for storing and retrieving data
 * in IndexedDB for offline support and data persistence.
 */

const DB_NAME = 'shelfwiser';
const DB_VERSION = 1;

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
            { name: 'name', keyPath: 'name' },
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
        indexes: [
            { name: 'shop_id', keyPath: 'shop_id' },
        ],
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
            console.error('[IndexedDB] Failed to open database:', request.error);
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
                        store.createIndex(index.name, index.keyPath, index.options);
                    });

                    console.log(`[IndexedDB] Created store: ${storeConfig.name}`);
                }
            });
        };
    });
}

/**
 * Get a single item by key from a store
 */
export async function getItem<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
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
    value: IDBValidKey
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
export async function putItem<T>(storeName: string, item: T): Promise<IDBValidKey> {
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
export async function putItems<T>(storeName: string, items: T[]): Promise<void> {
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
export async function deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
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
    data: any;
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
export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'>): Promise<void> {
    const offlineAction: OfflineAction = {
        ...action,
        timestamp: Date.now(),
        synced: false,
        retries: 0,
    };

    await putItem('offlineQueue', offlineAction);
    console.log('[IndexedDB] Queued offline action:', action.type, action.entity);

    // Request background sync if available
    if ('serviceWorker' in navigator && 'sync' in registration) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await (registration as any).sync.register('sync-offline-actions');
        } catch (error) {
            console.warn('[IndexedDB] Background sync not available:', error);
        }
    }
}

/**
 * Get pending offline actions
 */
export async function getPendingActions(): Promise<OfflineAction[]> {
    const actions = await getItemsByIndex<OfflineAction>('offlineQueue', 'synced', false);
    return actions.sort((a, b) => a.timestamp - b.timestamp);
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
export async function setSyncMetadata(key: string, value: any): Promise<void> {
    await putItem('syncMetadata', { key, value, updatedAt: Date.now() });
}

/**
 * Get sync metadata
 */
export async function getSyncMetadata(key: string): Promise<any> {
    const meta = await getItem<{ key: string; value: any }>('syncMetadata', key);
    return meta?.value;
}

/**
 * Get last sync timestamp for an entity
 */
export async function getLastSyncTime(entity: string): Promise<number | null> {
    const timestamp = await getSyncMetadata(`lastSync_${entity}`);
    return timestamp || null;
}

/**
 * Set last sync timestamp for an entity
 */
export async function setLastSyncTime(entity: string): Promise<void> {
    await setSyncMetadata(`lastSync_${entity}`, Date.now());
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
};
