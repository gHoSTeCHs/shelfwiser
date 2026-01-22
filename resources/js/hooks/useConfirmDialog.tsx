import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useCallback, useRef, useState } from 'react';

type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmDialogVariant;
}

interface UseConfirmDialogReturn {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    ConfirmDialogComponent: React.FC;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        setIsLoading(false);

        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        if (resolveRef.current) {
            resolveRef.current(false);
        }
        resolveRef.current = null;
    }, []);

    const handleConfirm = useCallback(() => {
        setIsLoading(true);
        setIsOpen(false);
        if (resolveRef.current) {
            resolveRef.current(true);
        }
        resolveRef.current = null;
        setIsLoading(false);
    }, []);

    const ConfirmDialogComponent: React.FC = useCallback(() => {
        if (!options) return null;

        return (
            <ConfirmDialog
                isOpen={isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={options.title}
                message={options.message}
                confirmLabel={options.confirmLabel}
                cancelLabel={options.cancelLabel}
                variant={options.variant}
                isLoading={isLoading}
            />
        );
    }, [isOpen, options, handleClose, handleConfirm, isLoading]);

    return { confirm, ConfirmDialogComponent };
}
