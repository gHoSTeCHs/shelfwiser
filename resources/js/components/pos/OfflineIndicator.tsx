import Button from '@/components/ui/button/Button';
import { Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import React from 'react';

interface OfflineIndicatorProps {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    lastSyncTime: number | null;
    productCount: number;
    onSync: () => void;
    className?: string;
}

/**
 * Status indicator for offline POS mode.
 * Shows connection status, pending orders, and sync controls.
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    productCount,
    onSync,
    className = '',
}) => {
    const formatSyncTime = (timestamp: number | null): string => {
        if (!timestamp) return 'Never';

        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Connection status */}
            <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    isOnline
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                        : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                }`}
            >
                {isOnline ? (
                    <>
                        <Cloud className="h-3.5 w-3.5" />
                        <span>Online</span>
                    </>
                ) : (
                    <>
                        <CloudOff className="h-3.5 w-3.5" />
                        <span>Offline</span>
                    </>
                )}
            </div>

            {/* Pending orders */}
            {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <span>{pendingCount} pending</span>
                </div>
            )}

            {/* Product count */}
            <div className="hidden items-center gap-1.5 text-xs text-gray-500 sm:flex dark:text-gray-400">
                <span>{productCount.toLocaleString()} products</span>
                {lastSyncTime && (
                    <>
                        <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <span className="text-gray-400 dark:text-gray-500">
                            Synced {formatSyncTime(lastSyncTime)}
                        </span>
                    </>
                )}
            </div>

            {/* Sync button */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSync}
                disabled={!isOnline || isSyncing}
                className="h-7 gap-1.5 px-2 text-xs"
            >
                {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                    {isSyncing ? 'Syncing...' : 'Sync'}
                </span>
            </Button>
        </div>
    );
};

export default OfflineIndicator;
