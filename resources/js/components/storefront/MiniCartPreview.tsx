import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import useCurrency from '@/hooks/useCurrency';
import { Service, ServiceVariant } from '@/types/service';
import { Shop } from '@/types/shop';
import { CartItem, CartSummary } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Package, ShoppingBag } from 'lucide-react';
import React from 'react';

interface MiniCartPreviewProps {
    shop: Shop;
    cartItems: CartItem[];
    cartSummary: CartSummary;
    isVisible: boolean;
    onClose: () => void;
}

const MiniCartPreview: React.FC<MiniCartPreviewProps> = ({
    shop,
    cartItems,
    cartSummary,
    isVisible,
    onClose,
}) => {
    const { formatCurrency } = useCurrency(shop);
    const displayItems = cartItems.slice(0, 3);
    const remainingCount = cartItems.length - 3;

    const isProduct = (item: CartItem) =>
        item.sellable_type === 'App\\Models\\ProductVariant' ||
        item.product_variant_id;

    const isService = (item: CartItem) =>
        item.sellable_type === 'App\\Models\\ServiceVariant';

    const getItemName = (item: CartItem) => {
        if (isProduct(item)) {
            return item.product_variant?.product?.name || 'Product';
        } else if (isService(item)) {
            const serviceVariant = item.sellable as
                | (ServiceVariant & { service?: Service })
                | undefined;
            return serviceVariant?.service?.name || 'Service';
        }
        return 'Item';
    };

    const getItemImage = (item: CartItem): string | undefined => {
        if (isProduct(item)) {
            return item.product_variant?.product?.images?.[0]?.url;
        } else if (isService(item)) {
            const serviceVariant = item.sellable as
                | (ServiceVariant & { service?: Service })
                | undefined;
            return serviceVariant?.service?.image_url ?? undefined;
        }
        return undefined;
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-navy-700 dark:bg-navy-800"
                    onMouseLeave={onClose}
                >
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-4 py-6">
                            <ShoppingBag className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Your cart is empty
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="max-h-64 overflow-y-auto p-3">
                                <div className="space-y-3">
                                    {displayItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-navy-700">
                                                {getItemImage(item) ? (
                                                    <img
                                                        src={getItemImage(item)}
                                                        alt={getItemName(item)}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-navy-500">
                                                        {isService(item) ? (
                                                            <Briefcase className="h-5 w-5" />
                                                        ) : (
                                                            <Package className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                    {getItemName(item)}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>•</span>
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {formatCurrency(
                                                            item.price * item.quantity,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {remainingCount > 0 && (
                                    <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                        +{remainingCount} more{' '}
                                        {remainingCount === 1 ? 'item' : 'items'}
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-gray-100 p-3 dark:border-navy-700">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Subtotal
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(cartSummary.subtotal)}
                                    </span>
                                </div>
                                <Link
                                    href={CartController.index.url({
                                        shop: shop.slug,
                                    })}
                                    className="block w-full rounded-lg bg-brand-500 py-2 text-center text-sm font-medium text-white transition hover:bg-brand-600"
                                    onClick={onClose}
                                >
                                    View Cart
                                </Link>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MiniCartPreview;
