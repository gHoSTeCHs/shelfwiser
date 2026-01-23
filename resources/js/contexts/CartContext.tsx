import React, { createContext, useCallback, useState } from 'react';

interface CartState {
    isDrawerOpen: boolean;
    isUpdating: boolean;
    updatingItemId: number | null;
}

export interface CartContextType extends CartState {
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
    setUpdating: (itemId: number | null) => void;
}

export const CartContext = createContext<CartContextType | undefined>(
    undefined,
);

interface CartProviderProps {
    children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

    const openDrawer = useCallback(() => {
        setIsDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    const toggleDrawer = useCallback(() => {
        setIsDrawerOpen((prev) => !prev);
    }, []);

    const setUpdating = useCallback((itemId: number | null) => {
        setUpdatingItemId(itemId);
        setIsUpdating(itemId !== null);
    }, []);

    const value: CartContextType = {
        isDrawerOpen,
        isUpdating,
        updatingItemId,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setUpdating,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};
