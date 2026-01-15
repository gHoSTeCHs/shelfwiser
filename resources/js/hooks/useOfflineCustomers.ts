import {
    clearExpiredCache,
    getCustomerCountForTenant,
    getLastSyncTime,
    isCacheExpired,
    putItems,
    searchCustomers as searchCustomersInDB,
    setLastSyncTime,
} from '@/lib/indexeddb';
import { SyncCustomer } from '@/types/sync';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface UseOfflineCustomersOptions {
    tenantId: number;
    autoSyncInterval?: number;
}

interface UseOfflineCustomersReturn {
    searchCustomers: (query: string) => Promise<SyncCustomer[]>;
    isSearching: boolean;
    syncCustomers: () => Promise<void>;
    isSyncing: boolean;
    lastSyncTime: number | null;
    customerCount: number;
    syncError: string | null;
    isOnline: boolean;
    isReady: boolean;
}

const SYNC_ENTITY = 'customers';
const DEFAULT_SYNC_INTERVAL = 10 * 60 * 1000;

/**
 * Hook for managing offline-capable customer search.
 *
 * - Syncs customers from server to IndexedDB
 * - Provides offline search capability
 * - Falls back to API when online if no local results
 */
export function useOfflineCustomers(
    options: UseOfflineCustomersOptions,
): UseOfflineCustomersReturn {
    const { tenantId, autoSyncInterval = DEFAULT_SYNC_INTERVAL } = options;

    const [isSearching, setIsSearching] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTimeState] = useState<number | null>(null);
    const [customerCount, setCustomerCount] = useState(0);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    const isOnline = useNetworkStatus();
    const isMountedRef = useRef(true);
    const isSyncingRef = useRef(false);

    /**
     * Sync customers from server to IndexedDB.
     * Uses incremental sync based on last sync time.
     */
    const syncCustomers = useCallback(async () => {
        if (!isOnline || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setIsSyncing(true);
        setSyncError(null);

        try {
            const lastSync = await getLastSyncTime(SYNC_ENTITY);
            const params = new URLSearchParams();
            if (lastSync) {
                params.append(
                    'updated_since',
                    new Date(lastSync).toISOString(),
                );
            }

            const response = await fetch(
                `/api/sync/customers?${params.toString()}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }

            const result = await response.json();
            const customers: SyncCustomer[] = result.data || [];

            if (customers.length > 0) {
                await putItems('customers', customers);
            }

            await setLastSyncTime(SYNC_ENTITY);

            if (isMountedRef.current) {
                const count = await getCustomerCountForTenant(tenantId);
                setCustomerCount(count);
                setLastSyncTimeState(Date.now());
            }
        } catch (error) {
            console.error('[useOfflineCustomers] Sync error:', error);
            if (isMountedRef.current) {
                setSyncError(
                    error instanceof Error ? error.message : 'Sync failed',
                );
            }
        } finally {
            isSyncingRef.current = false;
            if (isMountedRef.current) {
                setIsSyncing(false);
            }
        }
    }, [isOnline, tenantId]);

    const searchCustomers = useCallback(
        async (query: string): Promise<SyncCustomer[]> => {
            if (!query || query.length < 2) return [];

            setIsSearching(true);

            try {
                const localResults = await searchCustomersInDB<SyncCustomer>(
                    query,
                    tenantId,
                );

                if (localResults.length > 0) {
                    return localResults;
                }

                if (isOnline) {
                    const response = await fetch(
                        `/api/sync/customers?query=${encodeURIComponent(query)}`,
                        {
                            method: 'GET',
                            credentials: 'include',
                            headers: {
                                Accept: 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                        },
                    );

                    if (response.ok) {
                        const result = await response.json();
                        const customers: SyncCustomer[] = result.data || [];

                        if (customers.length > 0) {
                            await putItems('customers', customers);
                        }

                        return customers;
                    }
                }

                return [];
            } catch (error) {
                console.warn('[useOfflineCustomers] Search error:', error);
                return [];
            } finally {
                if (isMountedRef.current) {
                    setIsSearching(false);
                }
            }
        },
        [tenantId, isOnline],
    );

    /**
     * Initialize: clear expired cache, load sync time and customer count.
     * Triggers initial sync if no data or cache expired.
     */
    useEffect(() => {
        const initialize = async () => {
            try {
                await clearExpiredCache('customers');

                const [lastSync, count] = await Promise.all([
                    getLastSyncTime(SYNC_ENTITY),
                    getCustomerCountForTenant(tenantId),
                ]);

                if (isMountedRef.current) {
                    setLastSyncTimeState(lastSync);
                    setCustomerCount(count);
                    setIsReady(true);
                }

                const cacheExpired = await isCacheExpired(
                    SYNC_ENTITY,
                    autoSyncInterval,
                );

                if (count === 0 || !lastSync || cacheExpired) {
                    await syncCustomers();
                }
            } catch (error) {
                console.error('[useOfflineCustomers] Init error:', error);
                if (isMountedRef.current) {
                    setIsReady(true);
                }
            }
        };

        initialize();
    }, [tenantId, syncCustomers, autoSyncInterval]);

    /**
     * Set up periodic sync interval.
     * Only syncs if online and cache is expired.
     */
    useEffect(() => {
        if (!isOnline || autoSyncInterval <= 0) return;

        const interval = setInterval(async () => {
            const cacheExpired = await isCacheExpired(
                SYNC_ENTITY,
                autoSyncInterval,
            );
            if (cacheExpired) {
                syncCustomers();
            }
        }, autoSyncInterval);

        return () => clearInterval(interval);
    }, [isOnline, autoSyncInterval, syncCustomers]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        searchCustomers,
        isSearching,
        syncCustomers,
        isSyncing,
        lastSyncTime,
        customerCount,
        syncError,
        isOnline,
        isReady,
    };
}

export default useOfflineCustomers;
