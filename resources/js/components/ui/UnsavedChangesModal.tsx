import type { FC } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './modal';
import Button from './button/Button';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
}

const UnsavedChangesModal: FC<UnsavedChangesModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Unsaved Changes',
    message = 'You have unsaved changes that will be lost. Are you sure you want to leave this page?',
    confirmText = 'Leave Page',
    cancelText = 'Stay',
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} showCloseButton={false} className="max-w-md p-6">
            <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {message}
                </p>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                    <Button variant="outline" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default UnsavedChangesModal;
