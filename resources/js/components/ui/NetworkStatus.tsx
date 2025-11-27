import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

/**
 * Network status indicator component.
 *
 * Shows the current online/offline status and provides
 * visual feedback when the app is offline or syncing.
 */
const NetworkStatus: React.FC = () => {
    const { isOnline, isUpdateAvailable, applyUpdate } = usePWA();
    const [showOffline, setShowOffline] = React.useState(false);

    /**
     * Show offline indicator with delay to avoid flash
     */
    React.useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (!isOnline) {
            timeoutId = setTimeout(() => setShowOffline(true), 1000);
        } else {
            setShowOffline(false);
        }

        return () => clearTimeout(timeoutId);
    }, [isOnline]);

    if (!showOffline && !isUpdateAvailable) {
        return null;
    }

    return (
        <>
            {showOffline && (
                <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-lg animate-fade-in">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">You're offline</span>
                </div>
            )}

            {isUpdateAvailable && (
                <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg animate-fade-in">
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm font-medium">Update available</span>
                    <button
                        onClick={applyUpdate}
                        className="ml-2 px-2 py-1 text-xs bg-white text-blue-500 rounded hover:bg-blue-50"
                    >
                        Refresh
                    </button>
                </div>
            )}
        </>
    );
};

export default NetworkStatus;
