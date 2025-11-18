/**
 * PWA Hook for ShelfWiser
 *
 * Provides PWA functionality including service worker registration,
 * install prompt handling, and online/offline status.
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
    isInstalled: boolean;
    isInstallable: boolean;
    isOnline: boolean;
    isUpdateAvailable: boolean;
    registration: ServiceWorkerRegistration | null;
}

/**
 * Hook for PWA functionality
 */
export function usePWA() {
    const [state, setState] = useState<PWAState>({
        isInstalled: false,
        isInstallable: false,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isUpdateAvailable: false,
        registration: null,
    });

    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    /**
     * Register service worker
     */
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            registerServiceWorker();
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setState((prev) => ({ ...prev, isInstalled: true }));
        }
    }, []);

    /**
     * Handle online/offline status
     */
    useEffect(() => {
        const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
        const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    /**
     * Handle install prompt
     */
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
            setState((prev) => ({ ...prev, isInstallable: true }));
        };

        const handleAppInstalled = () => {
            setState((prev) => ({
                ...prev,
                isInstalled: true,
                isInstallable: false,
            }));
            setInstallPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    /**
     * Register service worker and handle updates
     */
    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            setState((prev) => ({ ...prev, registration }));

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setState((prev) => ({ ...prev, isUpdateAvailable: true }));
                        }
                    });
                }
            });

            // Check for waiting worker on load
            if (registration.waiting) {
                setState((prev) => ({ ...prev, isUpdateAvailable: true }));
            }

            console.log('[PWA] Service worker registered');
        } catch (error) {
            console.error('[PWA] Service worker registration failed:', error);
        }
    };

    /**
     * Prompt user to install the app
     */
    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!installPrompt) {
            console.warn('[PWA] Install prompt not available');
            return false;
        }

        try {
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;

            if (outcome === 'accepted') {
                setState((prev) => ({
                    ...prev,
                    isInstalled: true,
                    isInstallable: false,
                }));
                setInstallPrompt(null);
                return true;
            }

            return false;
        } catch (error) {
            console.error('[PWA] Install prompt failed:', error);
            return false;
        }
    }, [installPrompt]);

    /**
     * Apply pending service worker update
     */
    const applyUpdate = useCallback(async () => {
        if (!state.registration?.waiting) {
            return;
        }

        state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload page after service worker takes over
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }, [state.registration]);

    /**
     * Check for updates manually
     */
    const checkForUpdates = useCallback(async () => {
        if (!state.registration) {
            return;
        }

        try {
            await state.registration.update();
        } catch (error) {
            console.error('[PWA] Update check failed:', error);
        }
    }, [state.registration]);

    return {
        ...state,
        promptInstall,
        applyUpdate,
        checkForUpdates,
    };
}

export default usePWA;
