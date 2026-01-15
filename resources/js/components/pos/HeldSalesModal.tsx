import POSController from '@/actions/App/Http/Controllers/POSController';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import useToast from '@/hooks/useToast';
import {
    HeldSale,
    HeldSaleCustomer,
    HeldSaleResponse,
    HeldSalesResponse,
} from '@/types/held-sale';
import { Shop } from '@/types/shop';
import { POSCartItem } from '@/types/sync';
import {
    AlertTriangle,
    Clock,
    Loader2,
    Package,
    Pause,
    ShoppingCart,
    Trash2,
    User,
} from 'lucide-react';
import React from 'react';

interface HeldSalesModalProps {
    isOpen: boolean;
    onClose: () => void;
    shop: Shop;
    currentCart: POSCartItem[];
    currentCustomer: {
        id: number;
        first_name: string;
        last_name: string;
    } | null;
    onRetrieve: (
        items: POSCartItem[],
        customer: HeldSaleCustomer | null,
    ) => void;
    onHoldCurrentAndRetrieve: (heldSale: HeldSale) => Promise<void>;
}

type ConflictAction = 'hold' | 'clear' | null;

const HeldSalesModal: React.FC<HeldSalesModalProps> = ({
    isOpen,
    onClose,
    shop,
    currentCart,
    currentCustomer,
    onRetrieve,
    onHoldCurrentAndRetrieve,
}) => {
    const [heldSales, setHeldSales] = React.useState<HeldSale[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [retrievingId, setRetrievingId] = React.useState<number | null>(null);
    const [deletingId, setDeletingId] = React.useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<
        number | null
    >(null);
    const [showConflictDialog, setShowConflictDialog] =
        React.useState<HeldSale | null>(null);
    const [conflictAction, setConflictAction] =
        React.useState<ConflictAction>(null);

    const toast = useToast();

    const fetchHeldSales = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                POSController.heldSales.url({ shop: shop.id }),
            );
            if (!response.ok) {
                throw new Error('Failed to fetch held sales');
            }
            const data: HeldSalesResponse = await response.json();
            setHeldSales(data.held_sales);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load held sales',
            );
        } finally {
            setIsLoading(false);
        }
    }, [shop.id]);

    React.useEffect(() => {
        if (isOpen) {
            fetchHeldSales();
        }
    }, [isOpen, fetchHeldSales]);

    const handleRetrieveClick = (heldSale: HeldSale) => {
        if (currentCart.length > 0) {
            setShowConflictDialog(heldSale);
        } else {
            performRetrieve(heldSale);
        }
    };

    const performRetrieve = async (heldSale: HeldSale) => {
        setRetrievingId(heldSale.id);

        try {
            const response = await fetch(
                POSController.retrieveHeldSale.url({
                    shop: shop.id,
                    heldSale: heldSale.id,
                }),
                { method: 'POST' },
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to retrieve held sale');
            }

            const data: HeldSaleResponse = await response.json();
            toast.success(data.message);

            onRetrieve(data.held_sale.items, data.held_sale.customer);
            setHeldSales((prev) => prev.filter((s) => s.id !== heldSale.id));
            onClose();
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to retrieve held sale',
            );
        } finally {
            setRetrievingId(null);
        }
    };

    const handleConflictAction = async (action: ConflictAction) => {
        if (!showConflictDialog) return;

        setConflictAction(action);

        try {
            if (action === 'hold') {
                await onHoldCurrentAndRetrieve(showConflictDialog);
                setHeldSales((prev) =>
                    prev.filter((s) => s.id !== showConflictDialog.id),
                );
                onClose();
            } else if (action === 'clear') {
                await performRetrieve(showConflictDialog);
            }
        } finally {
            setConflictAction(null);
            setShowConflictDialog(null);
        }
    };

    const handleDelete = async (heldSale: HeldSale) => {
        setDeletingId(heldSale.id);

        try {
            const response = await fetch(
                POSController.deleteHeldSale.url({
                    shop: shop.id,
                    heldSale: heldSale.id,
                }),
                { method: 'DELETE' },
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete held sale');
            }

            const data = await response.json();
            toast.success(data.message);
            setHeldSales((prev) => prev.filter((s) => s.id !== heldSale.id));
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to delete held sale',
            );
        } finally {
            setDeletingId(null);
            setShowDeleteConfirm(null);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const calculateTotal = (items: POSCartItem[]) => {
        return items.reduce(
            (sum, item) => sum + item.unit_price * item.quantity,
            0,
        );
    };

    const isExpiringSoon = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        const expires = new Date(expiresAt);
        const now = new Date();
        const diffHours =
            (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours < 2;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
            <div className="mb-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                    <Pause className="h-5 w-5" />
                    Held Sales
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select a held sale to restore to your cart
                </p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                    <p className="mt-2 text-sm text-gray-500">
                        Loading held sales...
                    </p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="h-8 w-8 text-error-500" />
                    <p className="mt-2 text-sm text-error-600">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchHeldSales}
                        className="mt-4"
                    >
                        Try Again
                    </Button>
                </div>
            ) : heldSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <ShoppingCart className="h-12 w-12" aria-hidden="true" />
                    <p className="mt-2 font-medium">No held sales</p>
                    <p className="text-sm">Hold a sale to see it here</p>
                </div>
            ) : (
                <div
                    role="list"
                    aria-label="Held sales list"
                    className="custom-scrollbar max-h-96 space-y-3 overflow-y-auto"
                >
                    {heldSales.map((heldSale) => (
                        <div
                            key={heldSale.id}
                            role="listitem"
                            aria-label={`Held sale ${heldSale.hold_reference}, ${heldSale.items.length} items, ${shop.currency_symbol}${calculateTotal(heldSale.items).toFixed(2)}`}
                            className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                                            {heldSale.hold_reference}
                                        </span>
                                        {isExpiringSoon(
                                            heldSale.expires_at,
                                        ) && (
                                            <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs text-warning-700 dark:bg-warning-900 dark:text-warning-300">
                                                Expiring soon
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Package className="h-3.5 w-3.5" />
                                            {heldSale.items.length} item
                                            {heldSale.items.length !== 1
                                                ? 's'
                                                : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatTimeAgo(heldSale.created_at)}
                                        </span>
                                        {heldSale.customer && (
                                            <span className="flex items-center gap-1">
                                                <User className="h-3.5 w-3.5" />
                                                {
                                                    heldSale.customer.first_name
                                                }{' '}
                                                {heldSale.customer.last_name}
                                            </span>
                                        )}
                                    </div>

                                    {heldSale.notes && (
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                            {heldSale.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {shop.currency_symbol}
                                        {calculateTotal(heldSale.items).toFixed(
                                            2,
                                        )}
                                    </span>

                                    <div className="flex gap-2">
                                        {showDeleteConfirm === heldSale.id ? (
                                            <>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(heldSale)
                                                    }
                                                    loading={
                                                        deletingId ===
                                                        heldSale.id
                                                    }
                                                >
                                                    Confirm
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowDeleteConfirm(
                                                            null,
                                                        )
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowDeleteConfirm(
                                                            heldSale.id,
                                                        )
                                                    }
                                                    aria-label={`Delete held sale ${heldSale.hold_reference}`}
                                                    disabled={
                                                        retrievingId !== null ||
                                                        deletingId !== null
                                                    }
                                                >
                                                    <Trash2
                                                        className="h-4 w-4 text-error-500"
                                                        aria-hidden="true"
                                                    />
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleRetrieveClick(
                                                            heldSale,
                                                        )
                                                    }
                                                    aria-label={`Retrieve held sale ${heldSale.hold_reference}`}
                                                    loading={
                                                        retrievingId ===
                                                        heldSale.id
                                                    }
                                                    disabled={
                                                        retrievingId !== null ||
                                                        deletingId !== null
                                                    }
                                                >
                                                    Retrieve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showConflictDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="conflict-dialog-title"
                    aria-describedby="conflict-dialog-description"
                >
                    <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900">
                                <AlertTriangle
                                    className="h-5 w-5 text-warning-600 dark:text-warning-400"
                                    aria-hidden="true"
                                />
                            </div>
                            <div>
                                <h3
                                    id="conflict-dialog-title"
                                    className="font-semibold text-gray-900 dark:text-white"
                                >
                                    Cart Has Items
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Your cart has {currentCart.length} item
                                    {currentCart.length !== 1 ? 's' : ''}
                                    {currentCustomer
                                        ? ` for ${currentCustomer.first_name} ${currentCustomer.last_name}`
                                        : ''}
                                </p>
                            </div>
                        </div>

                        <p
                            id="conflict-dialog-description"
                            className="mb-6 text-sm text-gray-600 dark:text-gray-300"
                        >
                            What would you like to do with your current cart?
                        </p>

                        <div className="space-y-2">
                            <Button
                                variant="primary"
                                fullWidth
                                onClick={() => handleConflictAction('hold')}
                                loading={conflictAction === 'hold'}
                                disabled={conflictAction !== null}
                            >
                                <Pause className="mr-2 h-4 w-4" />
                                Hold Current Cart
                            </Button>
                            <p className="px-2 text-xs text-gray-500">
                                Save current cart as a new held sale, then load
                                the selected one
                            </p>

                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => handleConflictAction('clear')}
                                loading={conflictAction === 'clear'}
                                disabled={conflictAction !== null}
                                className="mt-3"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear Current Cart
                            </Button>
                            <p className="px-2 text-xs text-gray-500">
                                Discard current items and load the selected held
                                sale
                            </p>

                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={() => setShowConflictDialog(null)}
                                disabled={conflictAction !== null}
                                className="mt-3"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Modal>
    );
};

export default HeldSalesModal;
