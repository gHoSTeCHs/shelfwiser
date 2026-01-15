import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import CheckoutController from '@/actions/App/Http/Controllers/Storefront/CheckoutController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import { PaymentGatewaySelector, PaystackButton } from '@/components/payment';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { useFormValidation } from '@/hooks/useFormValidation';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { PaymentGateway, PaystackCallbackResponse } from '@/types/payment';
import {
    CartItem,
    CheckoutProps,
    PaymentGatewayInfo,
} from '@/types/storefront';
import { Form } from '@inertiajs/react';
import { CreditCard, MapPin, Package, StickyNote } from 'lucide-react';
import React from 'react';

/**
 * Checkout page component for processing orders.
 * Single-page checkout with shipping/billing address and order summary.
 */
const Checkout: React.FC<CheckoutProps> = ({
    shop,
    cart,
    cartSummary,
    addresses,
    customer,
    availableGateways = [],
    paymentReference,
}) => {
    const [billingSameAsShipping, setBillingSameAsShipping] =
        React.useState(true);
    const [saveAddresses, setSaveAddresses] = React.useState(true);
    const [selectedPaymentMethod, setSelectedPaymentMethod] =
        React.useState<string>('cash_on_delivery');
    const [isPaymentLoading, setIsPaymentLoading] = React.useState(false);

    const defaultAddress = addresses.find(
        (addr) => addr.is_default && addr.type === 'shipping',
    );

    const { errors: clientErrors, validateField } = useFormValidation({
        shipping_first_name: { required: true, minLength: 2, maxLength: 255 },
        shipping_last_name: { required: true, minLength: 2, maxLength: 255 },
        shipping_phone: { required: true, pattern: /^[\d\s\-+()]+$/ },
        shipping_address_1: { required: true, minLength: 5, maxLength: 255 },
        shipping_city: { required: true, minLength: 2, maxLength: 100 },
        shipping_state: { required: true, minLength: 2, maxLength: 100 },
        shipping_country: { required: true, minLength: 2, maxLength: 100 },
    });

    /**
     * Convert backend gateway info to frontend PaymentGateway type
     */
    const convertToPaymentGateway = (
        gateway: PaymentGatewayInfo,
    ): PaymentGateway => ({
        identifier: gateway.identifier,
        name: gateway.name,
        description: '',
        isAvailable: gateway.isAvailable,
        supportedCurrencies: gateway.supportedCurrencies,
        supportsInline: gateway.supportsInline,
        supportsRefunds: gateway.supportsRefunds,
    });

    /**
     * Get the selected gateway's public key for inline payments
     */
    const getSelectedGatewayPublicKey = (): string => {
        const gateway = availableGateways.find(
            (g) => g.identifier === selectedPaymentMethod,
        );
        return gateway?.publicKey || '';
    };

    /**
     * Check if selected payment method is Paystack (supports inline)
     */
    const isPaystackPayment = (): boolean => {
        return selectedPaymentMethod === 'paystack';
    };

    /**
     * Handle successful Paystack payment
     */
    const handlePaystackSuccess = (response: PaystackCallbackResponse) => {
        setIsPaymentLoading(true);
        window.location.href = `/payment/callback/paystack?reference=${response.reference}&trxref=${response.trxref}`;
    };

    /**
     * Handle Paystack payment modal close
     */
    const handlePaystackClose = () => {
        setIsPaymentLoading(false);
    };

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
            return item.sellable?.service?.name || 'Service';
        }
        return 'Item';
    };

    const getItemVariantName = (item: CartItem) => {
        if (isProduct(item)) {
            return item.productVariant?.sku;
        } else if (isService(item)) {
            return item.sellable?.name;
        }
        return null;
    };

    return (
        <StorefrontLayout
            shop={shop}
            customer={customer}
            cartItemCount={cartSummary.item_count}
        >
            <div className="mx-auto max-w-6xl">
                <Breadcrumbs
                    items={[
                        {
                            label: 'Home',
                            href: StorefrontController.index.url({
                                shop: shop.slug,
                            }),
                        },
                        {
                            label: 'Cart',
                            href: CartController.index.url({ shop: shop.slug }),
                        },
                        { label: 'Checkout' },
                    ]}
                />
                <h1 className="mt-6 mb-8 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                    Checkout
                </h1>
                <Form
                    action={CheckoutController.process.url({ shop: shop.slug })}
                    method="post"
                >
                    {({ errors, processing, data, setData }) => (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div className="space-y-6 lg:col-span-2">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800">
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
                                        <MapPin className="h-5 w-5 text-brand-500" />
                                        Shipping Address
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="shipping_first_name">
                                                    First Name{' '}
                                                    <span className="text-error-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="shipping_first_name"
                                                    name="shipping_address[first_name]"
                                                    type="text"
                                                    value={
                                                        data.shipping_address
                                                            ?.first_name ||
                                                        defaultAddress?.first_name ||
                                                        customer.first_name
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_address',
                                                            {
                                                                ...data.shipping_address,
                                                                first_name:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    onBlur={(e) =>
                                                        validateField(
                                                            'shipping_first_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={
                                                        !!errors[
                                                            'shipping_address.first_name'
                                                        ] ||
                                                        !!clientErrors.shipping_first_name
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            'shipping_address.first_name'
                                                        ] ||
                                                        clientErrors.shipping_first_name
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="shipping_last_name">
                                                    Last Name{' '}
                                                    <span className="text-error-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="shipping_last_name"
                                                    name="shipping_address[last_name]"
                                                    type="text"
                                                    value={
                                                        data.shipping_address
                                                            ?.last_name ||
                                                        defaultAddress?.last_name ||
                                                        customer.last_name
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_address',
                                                            {
                                                                ...data.shipping_address,
                                                                last_name:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    error={
                                                        !!errors[
                                                            'shipping_address.last_name'
                                                        ]
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            'shipping_address.last_name'
                                                        ]
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="shipping_phone">
                                                Phone Number{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="shipping_phone"
                                                name="shipping_address[phone]"
                                                type="tel"
                                                value={
                                                    data.shipping_address
                                                        ?.phone ||
                                                    defaultAddress?.phone ||
                                                    customer.phone ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'shipping_address',
                                                        {
                                                            ...data.shipping_address,
                                                            phone: e.target
                                                                .value,
                                                        },
                                                    )
                                                }
                                                error={
                                                    !!errors[
                                                        'shipping_address.phone'
                                                    ]
                                                }
                                                required
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        'shipping_address.phone'
                                                    ]
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="shipping_address_line_1">
                                                Address Line 1{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="shipping_address_line_1"
                                                name="shipping_address[address_line_1]"
                                                type="text"
                                                value={
                                                    data.shipping_address
                                                        ?.address_line_1 ||
                                                    defaultAddress?.address_line_1 ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'shipping_address',
                                                        {
                                                            ...data.shipping_address,
                                                            address_line_1:
                                                                e.target.value,
                                                        },
                                                    )
                                                }
                                                error={
                                                    !!errors[
                                                        'shipping_address.address_line_1'
                                                    ]
                                                }
                                                required
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        'shipping_address.address_line_1'
                                                    ]
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="shipping_address_line_2">
                                                Address Line 2
                                            </Label>
                                            <Input
                                                id="shipping_address_line_2"
                                                name="shipping_address[address_line_2]"
                                                type="text"
                                                value={
                                                    data.shipping_address
                                                        ?.address_line_2 ||
                                                    defaultAddress?.address_line_2 ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'shipping_address',
                                                        {
                                                            ...data.shipping_address,
                                                            address_line_2:
                                                                e.target.value,
                                                        },
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="shipping_city">
                                                    City{' '}
                                                    <span className="text-error-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="shipping_city"
                                                    name="shipping_address[city]"
                                                    type="text"
                                                    value={
                                                        data.shipping_address
                                                            ?.city ||
                                                        defaultAddress?.city ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_address',
                                                            {
                                                                ...data.shipping_address,
                                                                city: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                    error={
                                                        !!errors[
                                                            'shipping_address.city'
                                                        ]
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            'shipping_address.city'
                                                        ]
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="shipping_state">
                                                    State/Province{' '}
                                                    <span className="text-error-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="shipping_state"
                                                    name="shipping_address[state]"
                                                    type="text"
                                                    value={
                                                        data.shipping_address
                                                            ?.state ||
                                                        defaultAddress?.state ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_address',
                                                            {
                                                                ...data.shipping_address,
                                                                state: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                    error={
                                                        !!errors[
                                                            'shipping_address.state'
                                                        ]
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            'shipping_address.state'
                                                        ]
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="shipping_postal_code">
                                                    Postal Code
                                                </Label>
                                                <Input
                                                    id="shipping_postal_code"
                                                    name="shipping_address[postal_code]"
                                                    type="text"
                                                    value={
                                                        data.shipping_address
                                                            ?.postal_code ||
                                                        defaultAddress?.postal_code ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_address',
                                                            {
                                                                ...data.shipping_address,
                                                                postal_code:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="shipping_country">
                                                    Country{' '}
                                                    <span className="text-error-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="shipping_country"
                                                    name="shipping_address[country]"
                                                    type="text"
                                                    value={
                                                        data.shipping_address
                                                            ?.country ||
                                                        defaultAddress?.country ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'shipping_address',
                                                            {
                                                                ...data.shipping_address,
                                                                country:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    error={
                                                        !!errors[
                                                            'shipping_address.country'
                                                        ]
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            'shipping_address.country'
                                                        ]
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800">
                                    <div className="mb-4 flex items-center">
                                        <Checkbox
                                            id="billing_same_as_shipping"
                                            checked={billingSameAsShipping}
                                            onChange={(e) => {
                                                setBillingSameAsShipping(
                                                    e.target.checked,
                                                );
                                                setData(
                                                    'billing_same_as_shipping',
                                                    e.target.checked,
                                                );
                                            }}
                                        />
                                        <Label
                                            htmlFor="billing_same_as_shipping"
                                            className="mb-0 ml-2"
                                        >
                                            Billing address same as shipping
                                        </Label>
                                    </div>

                                    <input
                                        type="hidden"
                                        name="billing_same_as_shipping"
                                        value={
                                            billingSameAsShipping ? '1' : '0'
                                        }
                                    />
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800">
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
                                        <CreditCard className="h-5 w-5 text-brand-500" />
                                        Payment Method
                                    </h2>

                                    <PaymentGatewaySelector
                                        availableGateways={availableGateways.map(
                                            convertToPaymentGateway,
                                        )}
                                        selectedGateway={selectedPaymentMethod}
                                        onSelect={(gateway) => {
                                            setSelectedPaymentMethod(gateway);
                                            setData('payment_method', gateway);
                                        }}
                                        disabled={
                                            processing || isPaymentLoading
                                        }
                                        currency={shop.currency || 'NGN'}
                                    />

                                    <input
                                        type="hidden"
                                        name="payment_method"
                                        value={selectedPaymentMethod}
                                    />
                                    <input
                                        type="hidden"
                                        name="payment_reference"
                                        value={paymentReference}
                                    />
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800">
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
                                        <StickyNote className="h-5 w-5 text-brand-500" />
                                        Order Notes
                                    </h2>

                                    <Label htmlFor="customer_notes">
                                        Special Instructions (Optional)
                                    </Label>
                                    <textarea
                                        id="customer_notes"
                                        name="customer_notes"
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        value={data.customer_notes || ''}
                                        onChange={(e) =>
                                            setData(
                                                'customer_notes',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Any special requests or delivery instructions?"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <Checkbox
                                        id="save_addresses"
                                        checked={saveAddresses}
                                        onChange={(e) => {
                                            setSaveAddresses(e.target.checked);
                                            setData(
                                                'save_addresses',
                                                e.target.checked,
                                            );
                                        }}
                                    />
                                    <Label
                                        htmlFor="save_addresses"
                                        className="mb-0 ml-2"
                                    >
                                        Save addresses for future orders
                                    </Label>
                                </div>

                                <input
                                    type="hidden"
                                    name="save_addresses"
                                    value={saveAddresses ? '1' : '0'}
                                />
                            </div>

                            <div className="lg:col-span-1">
                                <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800">
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 sm:text-xl dark:text-white">
                                        <Package className="h-5 w-5 text-brand-500" />
                                        Order Summary
                                    </h2>

                                    <div className="space-y-4">
                                        {cartSummary.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between text-sm"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {getItemName(item)}
                                                        </p>
                                                        {isService(item) && (
                                                            <Badge
                                                                color="info"
                                                                size="sm"
                                                            >
                                                                Service
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        {getItemVariantName(
                                                            item,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        Qty: {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {shop.currency_symbol}
                                                    {item.subtotal?.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}

                                        <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                            <div className="flex justify-between text-sm">
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    Subtotal
                                                </p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {shop.currency_symbol}
                                                    {cartSummary.subtotal.toFixed(
                                                        2,
                                                    )}
                                                </p>
                                            </div>

                                            {cartSummary.tax > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        Tax
                                                    </p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {shop.currency_symbol}
                                                        {cartSummary.tax.toFixed(
                                                            2,
                                                        )}
                                                    </p>
                                                </div>
                                            )}

                                            {cartSummary.shipping_fee > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        Shipping
                                                    </p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {shop.currency_symbol}
                                                        {cartSummary.shipping_fee.toFixed(
                                                            2,
                                                        )}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-gray-700">
                                                <p className="text-gray-900 dark:text-white">
                                                    Total
                                                </p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {shop.currency_symbol}
                                                    {cartSummary.total.toFixed(
                                                        2,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {isPaystackPayment() &&
                                        getSelectedGatewayPublicKey() ? (
                                            <PaystackButton
                                                email={customer.email}
                                                amount={Math.round(
                                                    cartSummary.total * 100,
                                                )}
                                                currency={
                                                    shop.currency || 'NGN'
                                                }
                                                reference={paymentReference}
                                                publicKey={getSelectedGatewayPublicKey()}
                                                onSuccess={
                                                    handlePaystackSuccess
                                                }
                                                onClose={handlePaystackClose}
                                                metadata={{
                                                    order_number:
                                                        paymentReference,
                                                    shop_id: shop.id,
                                                    customer_id: customer.id,
                                                }}
                                                label="Pay Now"
                                                disabled={
                                                    processing ||
                                                    isPaymentLoading
                                                }
                                            />
                                        ) : (
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                fullWidth
                                                disabled={
                                                    processing ||
                                                    isPaymentLoading
                                                }
                                                loading={
                                                    processing ||
                                                    isPaymentLoading
                                                }
                                                className="mt-6"
                                            >
                                                {selectedPaymentMethod ===
                                                'cash_on_delivery'
                                                    ? 'Place Order'
                                                    : `Pay ${shop.currency_symbol}${cartSummary.total.toFixed(2)}`}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </StorefrontLayout>
    );
};

export default Checkout;
