import StorefrontLayout from '@/layouts/StorefrontLayout';
import { StorefrontCartProps } from '@/types/storefront';
import { Form, Link } from '@inertiajs/react';
import React from 'react';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import QuantitySelector from '@/components/storefront/QuantitySelector';
import OrderSummary from '@/components/storefront/OrderSummary';
import Button from '@/components/ui/button/Button';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/badge/Badge';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Trash2, ArrowRight, Package, Briefcase } from 'lucide-react';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import CheckoutController from '@/actions/App/Http/Controllers/Storefront/CheckoutController';

/**
 * Shopping cart page for viewing and managing cart items (products and services).
 * Allows quantity updates, item removal, and proceeding to checkout.
 */
const Cart: React.FC<StorefrontCartProps> = ({ shop, cart, cartSummary }) => {
    const [updatingItem, setUpdatingItem] = React.useState<number | null>(null);

    const handleQuantityChange = (itemId: number, newQuantity: number) => {
        setUpdatingItem(itemId);
    };

    const isProduct = (item: any) => {
        return item.sellable_type === 'App\\Models\\ProductVariant' || item.product_variant_id;
    };

    const isService = (item: any) => {
        return item.sellable_type === 'App\\Models\\ServiceVariant';
    };

    const getItemName = (item: any) => {
        if (isProduct(item)) {
            return item.productVariant?.product?.name || 'Product';
        } else if (isService(item)) {
            return item.sellable?.service?.name || 'Service';
        }
        return 'Item';
    };

    const getItemImage = (item: any) => {
        if (isProduct(item)) {
            return item.productVariant?.product?.image;
        } else if (isService(item)) {
            return item.sellable?.service?.image_url;
        }
        return null;
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
                        { label: 'Home', href: StorefrontController.index.url({ shop: shop.slug }) },
                        { label: 'Shopping Cart' },
                    ]}
                />

                <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>

                {cartSummary.item_count === 0 ? (
                    <Card className="p-12">
                        <EmptyState
                            icon={<ShoppingCart />}
                            title="Your cart is empty"
                            description="Add some products or book a service to get started"
                            action={
                                <div className="flex gap-3">
                                    <Link href={StorefrontController.products.url({ shop: shop.slug })}>
                                        <Button variant="primary">
                                            Browse Products
                                        </Button>
                                    </Link>
                                    <Link href={StorefrontController.services.url({ shop: shop.slug })}>
                                        <Button variant="outline">
                                            Browse Services
                                        </Button>
                                    </Link>
                                </div>
                            }
                        />
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {cart.items?.map((item) => (
                                <Card key={item.id} className="p-6">
                                    <div className="flex gap-6">
                                        {/* Item Image */}
                                        <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            {getItemImage(item) ? (
                                                <img
                                                    src={getItemImage(item)}
                                                    alt={getItemName(item)}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    {isService(item) ? (
                                                        <Briefcase className="w-8 h-8" />
                                                    ) : (
                                                        <Package className="w-8 h-8" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {getItemName(item)}
                                                        </h3>
                                                        {isService(item) && (
                                                            <Badge color="info" size="sm">Service</Badge>
                                                        )}
                                                    </div>

                                                    {/* Product-specific details */}
                                                    {isProduct(item) && (
                                                        <>
                                                            <p className="text-sm text-gray-600">
                                                                SKU: {item.productVariant?.sku}
                                                            </p>
                                                            {item.packagingType && (
                                                                <p className="text-sm text-gray-600">
                                                                    Packaging: {item.packagingType.name}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Service-specific details */}
                                                    {isService(item) && (
                                                        <>
                                                            <p className="text-sm text-gray-600">
                                                                {item.sellable?.name}
                                                            </p>
                                                            {item.material_option && getMaterialOptionLabel(item.material_option) && (
                                                                <p className="text-sm text-gray-600">
                                                                    <Badge color="warning" size="sm" className="mt-1">
                                                                        {getMaterialOptionLabel(item.material_option)}
                                                                    </Badge>
                                                                </p>
                                                            )}
                                                            {item.selected_addons && item.selected_addons.length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-gray-500">Add-ons:</p>
                                                                    {item.selected_addons.map((addon: any, idx: number) => (
                                                                        <p key={idx} className="text-sm text-gray-600">
                                                                            • {addon.name || `Addon #${addon.addon_id}`}
                                                                            {addon.quantity > 1 && ` (×${addon.quantity})`}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Remove button */}
                                                <Form
                                                    action={CartController.destroy.url({
                                                        shop: shop.slug,
                                                        item: item.id,
                                                    })}
                                                    method="delete"
                                                >
                                                    {({ processing }) => (
                                                        <button
                                                            type="submit"
                                                            disabled={processing}
                                                            className="text-error-600 hover:text-error-700 disabled:opacity-50"
                                                            aria-label="Remove item"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </Form>
                                            </div>

                                            <div className="flex justify-between items-center mt-4">
                                                {/* Quantity selector */}
                                                <Form
                                                    action={CartController.update.url({
                                                        shop: shop.slug,
                                                        item: item.id,
                                                    })}
                                                    method="patch"
                                                >
                                                    {({ processing, setData }) => (
                                                        <>
                                                            <QuantitySelector
                                                                quantity={item.quantity}
                                                                onChange={(newQuantity) => {
                                                                    setData('quantity', newQuantity);
                                                                    handleQuantityChange(item.id, newQuantity);
                                                                }}
                                                                min={1}
                                                                max={isProduct(item) ? (item.productVariant?.available_stock || 999) : 999}
                                                                disabled={processing}
                                                            />
                                                            <input type="hidden" name="quantity" value={item.quantity} />
                                                            {updatingItem === item.id && (
                                                                <Button
                                                                    type="submit"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={processing}
                                                                    loading={processing}
                                                                    className="ml-4"
                                                                >
                                                                    Update
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </Form>

                                                {/* Price */}
                                                <div className="text-right">
                                                    {isService(item) && item.base_price && (
                                                        <p className="text-xs text-gray-500">
                                                            Base: {shop.currency_symbol}{item.base_price.toFixed(2)}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-gray-600">
                                                        {shop.currency_symbol}{item.price.toFixed(2)} each
                                                    </p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {shop.currency_symbol}{item.subtotal?.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Stock warning for products only */}
                                            {isProduct(item) && item.productVariant && item.quantity > item.productVariant.available_stock && (
                                                <p className="text-sm text-error-600 mt-2">
                                                    Only {item.productVariant.available_stock} available in stock
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            <div className="flex justify-between items-center pt-4">
                                <Link href={StorefrontController.products.url({ shop: shop.slug })}>
                                    <Button variant="outline">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="p-6 sticky top-20">
                                <OrderSummary
                                    summary={cartSummary}
                                    shop={shop}
                                    title="Cart Summary"
                                />

                                <Link
                                    href={CheckoutController.index.url({ shop: shop.slug })}
                                    className="block mt-6"
                                >
                                    <Button variant="primary" fullWidth size="lg" endIcon={<ArrowRight />}>
                                        Proceed to Checkout
                                    </Button>
                                </Link>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
};

export default Cart;
