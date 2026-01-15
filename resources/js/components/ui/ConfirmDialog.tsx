import React from 'react';
import { Modal } from './modal';
import Button from './button/Button';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmDialogVariant;
    isLoading?: boolean;
}

const variantConfig: Record<ConfirmDialogVariant, {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    confirmVariant: 'destructive' | 'primary';
}> = {
    danger: {
        icon: <XCircle className="h-6 w-6" />,
        iconBg: 'bg-error-100 dark:bg-error-900/30',
        iconColor: 'text-error-600 dark:text-error-400',
        confirmVariant: 'destructive',
    },
    warning: {
        icon: <AlertTriangle className="h-6 w-6" />,
        iconBg: 'bg-warning-100 dark:bg-warning-900/30',
        iconColor: 'text-warning-600 dark:text-warning-400',
        confirmVariant: 'primary',
    },
    info: {
        icon: <Info className="h-6 w-6" />,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        confirmVariant: 'primary',
    },
    success: {
        icon: <CheckCircle className="h-6 w-6" />,
        iconBg: 'bg-success-100 dark:bg-success-900/30',
        iconColor: 'text-success-600 dark:text-success-400',
        confirmVariant: 'primary',
    },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    isLoading = false,
}) => {
    const config = variantConfig[variant];

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false}
            className="max-w-md mx-4"
            title={title}
            description={message}
        >
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${config.iconBg} ${config.iconColor}`}>
                        {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={config.confirmVariant}
                        onClick={handleConfirm}
                        loading={isLoading}
                        disabled={isLoading}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
