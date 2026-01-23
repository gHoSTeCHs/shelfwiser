import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import useCurrency from '@/hooks/useCurrency';
import { Service, ServiceVariant } from '@/types/service';
import { Shop } from '@/types/shop';
import { CartItem } from '@/types/storefront';
import { router } from '@inertiajs/react';
import { Briefcase, Minus, Package, Plus, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface CartDrawerItemProps {
    item: CartItem;
    shop: Shop;
}

const CartDrawerItem: React.FC<CartDrawerItemProps> = ({ item, shop }) => {
    const { formatCurrency } = useCurrency(shop);
    const [localQuantity, setLocalQuantity] = useState(item.quantity);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isProduct =
        item.sellable_type === 'App\\Models\\ProductVariant' ||
        item.product_variant_id;

    const isService = item.sellable_type === 'App\\Models\\ServiceVariant';

    const getItemName = () => {
        if (isProduct) {
            return item.product_variant?.product?.name || 'Product';
        } else if (isService) {
            const serviceVariant = item.sellable as
                | (ServiceVariant & { service?: Service })
                | undefined;
            return serviceVariant?.service?.name || 'Service';
        }
        return 'Item';
    };

    const getItemImage = (): string | undefined => {
        if (isProduct) {
            return item.product_variant?.product?.images?.[0]?.url;
        } else if (isService) {
            const serviceVariant = item.sellable as
                | (ServiceVariant & { service?: Service })
                | undefined;
            return serviceVariant?.service?.image_url ?? undefined;
        }
        return undefined;
    };

    const getVariantInfo = () => {
        if (isProduct) {
            return item.product_variant?.sku || null;
        }
        if (isService && item.sellable?.name) {
            return item.sellable.name;
        }
        return null;
    };

    const maxQuantity = isProduct
        ? item.product_variant?.available_stock || 999
        : 999;

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity < 1 || newQuantity > maxQuantity) return;

        setLocalQuantity(newQuantity);
        setIsUpdating(true);

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            router.patch(
                CartController.update.url({
                    shop: shop.slug,
                    item: item.id,
                }),
                { quantity: newQuantity },
                {
                    preserveScroll: true,
                    only: ['cart', 'cartSummary', 'cartItemCount'],
                    onFinish: () => setIsUpdating(false),
                },
            );
        }, 800);
    };

    const handleRemove = () => {
        setIsRemoving(true);
        router.delete(
            CartController.destroy.url({
                shop: shop.slug,
                item: item.id,
            }),
            {
                preserveScroll: true,
                only: ['cart', 'cartSummary', 'cartItemCount'],
                onFinish: () => setIsRemoving(false),
            },
        );
    };

    React.useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        setLocalQuantity(item.quantity);
    }, [item.quantity]);

    return (
        <div
            className={`flex gap-3 py-3 ${isRemoving ? 'pointer-events-none opacity-50' : ''}`}
        >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-navy-700">
                {getItemImage() ? (
                    <img
                        src={getItemImage()}
                        alt={getItemName()}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-navy-500">
                        {isService ? (
                            <Briefcase className="h-6 w-6" />
                        ) : (
                            <Package className="h-6 w-6" />
                        )}
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {getItemName()}
                        </h4>
                        {getVariantInfo() && (
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {getVariantInfo()}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="flex-shrink-0 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-error-600 disabled:opacity-50 dark:hover:bg-navy-700 dark:hover:text-error-400"
                        aria-label="Remove item"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(localQuantity - 1)}
                            disabled={localQuantity <= 1 || isUpdating}
                            className="rounded border border-gray-200 p-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:hover:bg-navy-700"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[24px] text-center text-sm font-medium text-gray-900 dark:text-white">
                            {localQuantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(localQuantity + 1)}
                            disabled={localQuantity >= maxQuantity || isUpdating}
                            className="rounded border border-gray-200 p-1 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:hover:bg-navy-700"
                            aria-label="Increase quantity"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                        {isUpdating && (
                            <span className="ml-1 text-xs text-gray-400">...</span>
                        )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.price * localQuantity)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CartDrawerItem;
