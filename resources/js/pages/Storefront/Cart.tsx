import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import CheckoutController from '@/actions/App/Http/Controllers/Storefront/CheckoutController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import OrderSummary from '@/components/storefront/OrderSummary';
import QuantitySelector from '@/components/storefront/QuantitySelector';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import EmptyState from '@/components/ui/EmptyState';
import useCurrency from '@/hooks/useCurrency';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Service, ServiceVariant } from '@/types/service';
import { CartItem, StorefrontCartProps } from '@/types/storefront';
import { Form, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Briefcase,
    Package,
    ShoppingCart,
    Trash2,
} from 'lucide-react';
import React from 'react';

/**
 * Shopping cart page for viewing and managing cart items (products and services).
 * Allows quantity updates, item removal, and proceeding to checkout.
 */
const Cart: React.FC<StorefrontCartProps> = ({ shop, cart, cartSummary }) => {
    const { formatCurrency } = useCurrency(shop);
    const [updatingItem, setUpdatingItem] = React.useState<number | null>(null);
    const updateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleQuantityChange = (
        itemId: number,
        newQuantity: number,
    ) => {
        setUpdatingItem(itemId);

        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
            router.patch(
                CartController.update.url({
                    shop: shop.slug,
                    item: itemId,
                }),
                { quantity: newQuantity },
                {
                    preserveScroll: true,
                    onFinish: () => setUpdatingItem(null),
                },
            );
        }, 800);
    };

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    const isProduct = (item: CartItem) => {
        return (
            item.sellable_type === 'App\\Models\\ProductVariant' ||
            item.product_variant_id
        );
    };

    const isService = (item: CartItem) => {
        return item.sellable_type === 'App\\Models\\ServiceVariant';
    };

    const getItemName = (item: CartItem) => {
        if (isProduct(item)) {
            return item.productVariant?.product?.name || 'Product';
        } else if (isService(item)) {
            const serviceVariant = item.sellable as (ServiceVariant & { service?: Service }) | undefined;
            return serviceVariant?.service?.name || 'Service';
        }
        return 'Item';
    };

    const getItemImage = (item: CartItem): string | undefined => {
        if (isProduct(item)) {
            return item.productVariant?.product?.images?.[0]?.url;
        } else if (isService(item)) {
            const serviceVariant = item.sellable as (ServiceVariant & { service?: Service }) | undefined;
            return serviceVariant?.service?.image_url ?? undefined;
        }
        return undefined;
    };

    const getMaterialOptionLabel = (option: string) => {
        switch (option) {
            case 'customer_materials':
                return 'Customer Materials';
            case 'shop_materials':
                return 'Shop Materials';
            default:
                return null;
        }
    };

    return (
        <StorefrontLayout shop={shop} cartItemCount={cartSummary.item_count}>
            <div className="space-y-6">
                <Breadcrumbs
                    items={[
                        {
                            label: 'Home',
                            href: StorefrontController.index.url({
                                shop: shop.slug,
                            }),
                        },
                        { label: 'Shopping Cart' },
                    ]}
                />

                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                    Shopping Cart
                </h1>

                {cartSummary.item_count === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 dark:border-navy-700 dark:bg-navy-800"
                    >
                        <EmptyState
                            icon={<ShoppingCart />}
                            title="Your cart is empty"
                            description="Add some products or book a service to get started"
                            action={
                                <div className="flex gap-3">
                                    <Link
                                        href={StorefrontController.products.url(
                                            { shop: shop.slug },
                                        )}
                                    >
                                        <Button variant="primary">
                                            Browse Products
                                        </Button>
                                    </Link>
                                    <Link
                                        href={StorefrontController.services.url(
                                            { shop: shop.slug },
                                        )}
                                    >
                                        <Button variant="outline">
                                            Browse Services
                                        </Button>
                                    </Link>
                                </div>
                            }
                        />
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                        <div className="space-y-4 lg:col-span-2">
                            <AnimatePresence>
                                {cart.items?.map((item) => (
                                    <motion.article
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800"
                                    >
                                        <div className="flex gap-4 sm:gap-6">
                                            {/* Item Image */}
                                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24 dark:bg-navy-700">
                                                {getItemImage(item) ? (
                                                    <img
                                                        src={getItemImage(item)}
                                                        alt={getItemName(item)}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-navy-500">
                                                        {isService(item) ? (
                                                            <Briefcase className="h-8 w-8" />
                                                        ) : (
                                                            <Package className="h-8 w-8" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="mb-2 flex items-start justify-between">
                                                    <div>
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                                {getItemName(
                                                                    item,
                                                                )}
                                                            </h3>
                                                            {isService(
                                                                item,
                                                            ) && (
                                                                <Badge
                                                                    color="info"
                                                                    size="sm"
                                                                >
                                                                    Service
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Product-specific details */}
                                                        {isProduct(item) && (
                                                            <>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    SKU:{' '}
                                                                    {
                                                                        item
                                                                            .productVariant
                                                                            ?.sku
                                                                    }
                                                                </p>
                                                                {item.packagingType && (
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        Packaging:{' '}
                                                                        {
                                                                            item
                                                                                .packagingType
                                                                                .name
                                                                        }
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Service-specific details */}
                                                        {isService(item) && (
                                                            <>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {
                                                                        item
                                                                            .sellable
                                                                            ?.name
                                                                    }
                                                                </p>
                                                                {item.material_option &&
                                                                    getMaterialOptionLabel(
                                                                        item.material_option,
                                                                    ) && (
                                                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                                            <Badge
                                                                                color="warning"
                                                                                size="sm"
                                                                            >
                                                                                {getMaterialOptionLabel(
                                                                                    item.material_option,
                                                                                )}
                                                                            </Badge>
                                                                        </p>
                                                                    )}
                                                                {item.selected_addons &&
                                                                    item
                                                                        .selected_addons
                                                                        .length >
                                                                        0 && (
                                                                        <div className="mt-2">
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                Add-ons:
                                                                            </p>
                                                                            {item.selected_addons.map(
                                                                                (
                                                                                    addon,
                                                                                    idx,
                                                                                ) => (
                                                                                    <p
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        className="text-sm text-gray-600 dark:text-gray-400"
                                                                                    >
                                                                                        •{' '}
                                                                                        {addon.name ||
                                                                                            `Addon #${addon.addon_id}`}
                                                                                        {addon.quantity >
                                                                                            1 &&
                                                                                            ` (×${addon.quantity})`}
                                                                                    </p>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Remove button */}
                                                    <Form
                                                        action={CartController.destroy.url(
                                                            {
                                                                shop: shop.slug,
                                                                item: item.id,
                                                            },
                                                        )}
                                                        method="delete"
                                                    >
                                                        {({ processing }) => (
                                                            <button
                                                                type="submit"
                                                                disabled={
                                                                    processing
                                                                }
                                                                className="text-error-600 hover:text-error-700 disabled:opacity-50 dark:text-error-400 dark:hover:text-error-300"
                                                                aria-label="Remove item"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </Form>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <QuantitySelector
                                                            quantity={
                                                                item.quantity
                                                            }
                                                            onChange={(
                                                                newQuantity,
                                                            ) =>
                                                                handleQuantityChange(
                                                                    item.id,
                                                                    newQuantity,
                                                                )
                                                            }
                                                            min={1}
                                                            max={
                                                                isProduct(item)
                                                                    ? item
                                                                          .productVariant
                                                                          ?.available_stock ||
                                                                      999
                                                                    : 999
                                                            }
                                                            disabled={
                                                                updatingItem ===
                                                                item.id
                                                            }
                                                        />
                                                        {updatingItem ===
                                                            item.id && (
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                Updating...
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-right">
                                                        {isService(item) &&
                                                            item.base_price && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Base: {formatCurrency(item.base_price)}
                                                                </p>
                                                            )}
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {formatCurrency(item.price)} each
                                                        </p>
                                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(item.subtotal)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Stock warning for products only */}
                                                {isProduct(item) &&
                                                    item.productVariant &&
                                                    item.productVariant.available_stock !== undefined &&
                                                    item.quantity >
                                                        item.productVariant
                                                            .available_stock && (
                                                        <p className="mt-2 text-sm text-error-600 dark:text-error-400">
                                                            Only{' '}
                                                            {
                                                                item
                                                                    .productVariant
                                                                    .available_stock
                                                            }{' '}
                                                            available in stock
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                            </AnimatePresence>

                            <div className="flex items-center justify-between pt-4">
                                <Link
                                    href={StorefrontController.products.url({
                                        shop: shop.slug,
                                    })}
                                >
                                    <Button variant="outline">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-navy-700 dark:bg-navy-800">
                                <OrderSummary
                                    summary={cartSummary}
                                    shop={shop}
                                    title="Cart Summary"
                                />

                                <Link
                                    href={CheckoutController.index.url({
                                        shop: shop.slug,
                                    })}
                                    className="mt-6 block"
                                >
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        size="lg"
                                        endIcon={<ArrowRight />}
                                    >
                                        Proceed to Checkout
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
};

export default Cart;
