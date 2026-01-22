import React from 'react';
import Toast from './Toast';
import { Toast as ToastType, ToastPosition } from '@/types/toast';

interface ToastContainerProps {
    toasts: ToastType[];
    onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onDismiss,
}) => {
    const getPositionClasses = (position: ToastPosition): string => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-center':
                return 'top-4 left-1/2 -translate-x-1/2';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-center':
                return 'bottom-4 left-1/2 -translate-x-1/2';
            case 'bottom-right':
            default:
                return 'bottom-4 right-4';
        }
    };

    // Group toasts by position
    const groupedToasts = toasts.reduce((acc, toast) => {
        if (!acc[toast.position]) {
            acc[toast.position] = [];
        }
        acc[toast.position].push(toast);
        return acc;
    }, {} as Record<ToastPosition, ToastType[]>);

    return (
        <>
            {Object.entries(groupedToasts).map(([position, positionToasts]) => (
                <div
                    key={position}
                    className={`
                        fixed z-999999 flex flex-col gap-3
                        w-full max-w-sm px-4 sm:px-0
                        pointer-events-none
                        ${getPositionClasses(position as ToastPosition)}
                    `}
                >
                    {positionToasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto">
                            <Toast toast={toast} onDismiss={onDismiss} />
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
};

export default ToastContainer;
