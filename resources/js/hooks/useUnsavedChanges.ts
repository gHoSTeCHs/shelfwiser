import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseUnsavedChangesOptions<T> {
    initialData: T;
    currentData: T;
    compareFunction?: (a: T, b: T) => boolean;
    message?: string;
}

interface UseUnsavedChangesReturn {
    hasUnsavedChanges: boolean;
    showWarningModal: boolean;
    pendingNavigation: string | null;
    confirmNavigation: () => void;
    cancelNavigation: () => void;
    resetChanges: () => void;
}

function defaultCompare<T>(a: T, b: T): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

export function useUnsavedChanges<T>({
    initialData,
    currentData,
    compareFunction = defaultCompare,
    message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesOptions<T>): UseUnsavedChangesReturn {
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(
        null,
    );
    const initialDataRef = useRef<T>(initialData);

    const hasUnsavedChanges = !compareFunction(
        initialDataRef.current,
        currentData,
    );

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = message;
            return message;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, message]);

    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const removeStartListener = router.on('before', (event) => {
            if (hasUnsavedChanges && !pendingNavigation) {
                event.preventDefault();
                setPendingNavigation(event.detail.visit.url.href);
                setShowWarningModal(true);
                return false;
            }
            return true;
        });

        return () => {
            removeStartListener();
        };
    }, [hasUnsavedChanges, pendingNavigation]);

    const confirmNavigation = useCallback(() => {
        if (pendingNavigation) {
            setShowWarningModal(false);
            const url = pendingNavigation;
            setPendingNavigation(null);
            router.visit(url);
        }
    }, [pendingNavigation]);

    const cancelNavigation = useCallback(() => {
        setShowWarningModal(false);
        setPendingNavigation(null);
    }, []);

    const resetChanges = useCallback(() => {
        initialDataRef.current = currentData;
    }, [currentData]);

    return {
        hasUnsavedChanges,
        showWarningModal,
        pendingNavigation,
        confirmNavigation,
        cancelNavigation,
        resetChanges,
    };
}

export default useUnsavedChanges;
