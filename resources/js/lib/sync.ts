/**
 * Sync Mechanism for ShelfWiser PWA
 *
 * Handles synchronization of offline data with the server
 * when the application comes back online.
 */

import {
    getPendingActions,
    markActionSynced,
    putItem,
    getItem,
    setLastSyncTime,
    getLastSyncTime,
    OfflineAction,
    putItems,
} from './indexeddb';

/**
 * Maximum number of retries for failed sync attempts
 */
const MAX_RETRIES = 3;

/**
 * Sync status for UI updates
 */
export interface SyncStatus {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime: number | null;
    error: string | null;
}

/**
 * Sync event callbacks
 */
type SyncCallback = (status: SyncStatus) => void;
const syncCallbacks: Set<SyncCallback> = new Set();

/**
 * Current sync status
 */
let currentStatus: SyncStatus = {
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    error: null,
};

/**
 * Subscribe to sync status updates
 */
export function onSyncStatusChange(callback: SyncCallback): () => void {
    syncCallbacks.add(callback);
    callback(currentStatus);
    return () => syncCallbacks.delete(callback);
}

/**
 * Update and broadcast sync status
 */
function updateStatus(updates: Partial<SyncStatus>): void {
    currentStatus = { ...currentStatus, ...updates };
    syncCallbacks.forEach((callback) => callback(currentStatus));
}

/**
 * Check if the app is online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Sync all pending offline actions
 */
export async function syncOfflineActions(): Promise<void> {
    if (!isOnline()) {
        console.log('[Sync] Offline, skipping sync');
        return;
    }

    const pendingActions = await getPendingActions();

    if (pendingActions.length === 0) {
        console.log('[Sync] No pending actions');
        return;
    }

    updateStatus({ isSyncing: true, pendingCount: pendingActions.length, error: null });

    console.log(`[Sync] Processing ${pendingActions.length} pending actions`);

    let successCount = 0;
    let errorCount = 0;

    for (const action of pendingActions) {
        try {
            const success = await processAction(action);
            if (success) {
                successCount++;
            } else {
                errorCount++;
            }
        } catch (error) {
            console.error('[Sync] Failed to process action:', error);
            errorCount++;
        }
    }

    const remaining = await getPendingActions();

    updateStatus({
        isSyncing: false,
        pendingCount: remaining.length,
        lastSyncTime: Date.now(),
        error: errorCount > 0 ? `${errorCount} actions failed to sync` : null,
    });

    console.log(`[Sync] Completed: ${successCount} success, ${errorCount} errors`);
}

/**
 * Process a single offline action
 */
async function processAction(action: OfflineAction): Promise<boolean> {
    if (action.retries >= MAX_RETRIES) {
        console.warn(`[Sync] Action ${action.id} exceeded max retries, skipping`);
        return false;
    }

    try {
        const response = await fetch(action.url, {
            method: action.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...action.headers,
            },
            body: action.method !== 'GET' ? JSON.stringify(action.data) : undefined,
            credentials: 'same-origin',
        });

        if (response.ok) {
            if (action.id) {
                await markActionSynced(action.id);
            }
            console.log(`[Sync] Action ${action.id} synced successfully`);
            return true;
        }

        // Handle specific error responses
        if (response.status === 409) {
            // Conflict - mark as synced to avoid retry loops
            console.warn(`[Sync] Action ${action.id} conflict, marking as synced`);
            if (action.id) {
                await markActionSynced(action.id);
            }
            return true;
        }

        // Increment retry count
        action.retries++;
        action.lastError = `HTTP ${response.status}: ${response.statusText}`;
        await putItem('offlineQueue', action);
        return false;
    } catch (error) {
        action.retries++;
        action.lastError = error instanceof Error ? error.message : 'Unknown error';
        await putItem('offlineQueue', action);
        return false;
    }
}

/**
 * Sync data from server to local IndexedDB
 */
export async function syncFromServer(entity: string, apiUrl: string): Promise<void> {
    if (!isOnline()) {
        console.log(`[Sync] Offline, skipping ${entity} sync`);
        return;
    }

    try {
        const lastSync = await getLastSyncTime(entity);
        const url = lastSync ? `${apiUrl}?updated_since=${lastSync}` : apiUrl;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const items = data.data || data;

        if (Array.isArray(items) && items.length > 0) {
            await putItems(entity, items);
            console.log(`[Sync] Synced ${items.length} ${entity} from server`);
        }

        await setLastSyncTime(entity);
    } catch (error) {
        console.error(`[Sync] Failed to sync ${entity} from server:`, error);
    }
}

/**
 * Full sync - sync all entities
 */
export async function fullSync(): Promise<void> {
    if (!isOnline()) {
        console.log('[Sync] Offline, skipping full sync');
        return;
    }

    updateStatus({ isSyncing: true, error: null });

    try {
        // First, push local changes
        await syncOfflineActions();

        // Then, pull server changes for each entity
        await syncFromServer('products', '/api/sync/products');
        await syncFromServer('customers', '/api/sync/customers');
        await syncFromServer('orders', '/api/sync/orders');

        updateStatus({
            isSyncing: false,
            lastSyncTime: Date.now(),
            error: null,
        });

        console.log('[Sync] Full sync completed');
    } catch (error) {
        updateStatus({
            isSyncing: false,
            error: error instanceof Error ? error.message : 'Sync failed',
        });
        console.error('[Sync] Full sync failed:', error);
    }
}

/**
 * Initialize sync listeners
 */
export function initializeSync(): void {
    // Listen for online/offline events
    window.addEventListener('online', async () => {
        console.log('[Sync] App is online, starting sync');
        await syncOfflineActions();
    });

    window.addEventListener('offline', () => {
        console.log('[Sync] App is offline');
    });

    // Periodic sync when online (every 5 minutes)
    setInterval(async () => {
        if (isOnline()) {
            await syncOfflineActions();
        }
    }, 5 * 60 * 1000);

    // Initial sync check
    if (isOnline()) {
        syncOfflineActions();
    }

    console.log('[Sync] Sync mechanism initialized');
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
    return currentStatus;
}

export default {
    syncOfflineActions,
    syncFromServer,
    fullSync,
    initializeSync,
    isOnline,
    onSyncStatusChange,
    getSyncStatus,
};
