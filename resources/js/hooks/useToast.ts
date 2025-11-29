import { useContext } from 'react';
import { ToastContext } from '@/contexts/ToastContext';
import { ToastContextType } from '@/types/toast';

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);

    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
};

export default useToast;
