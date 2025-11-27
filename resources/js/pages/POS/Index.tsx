import POSController from '@/actions/App/Http/Controllers/POSController';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import AppLayout from '@/components/layouts/AppLayout';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { Shop } from '@/types/shop';
import { Head, useForm } from '@inertiajs/react';
import {
    Check,
    Loader2,
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    User,
    X,
} from 'lucide-react';
import React from 'react';

interface POSProps {
    shop: Shop;
    paymentMethods: Record<string, string>;
}

interface CartItem {
    variant_id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    packaging_type_id?: number;
    discount_amount?: number;
}

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
}

interface Product {
    id: number;
    sku: string;
    barcode: string | null;
    price: number;
    track_stock: boolean;
    stock_quantity: number;
    product: {
        id: number;
        name: string;
        is_taxable: boolean;
    };
}

const Index: React.FC<POSProps> = ({ shop, paymentMethods }) => {
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<Product[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchError, setSearchError] = React.useState<string | null>(null);

    const [selectedCustomer, setSelectedCustomer] =
        React.useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = React.useState('');
    const [customerResults, setCustomerResults] = React.useState<Customer[]>(
        [],
    );
    const [isSearchingCustomers, setIsSearchingCustomers] =
        React.useState(false);
    const [customerSearchError, setCustomerSearchError] = React.useState<
        string | null
    >(null);
    const [showCustomerSearch, setShowCustomerSearch] = React.useState(false);

    const [discount, setDiscount] = React.useState('');
    const [notes, setNotes] = React.useState('');

    const searchAbortControllerRef = React.useRef<AbortController>(
        new AbortController(),
    );
    const customerSearchAbortControllerRef = React.useRef<AbortController>(
        new AbortController(),
    );

    const form = useForm({
        items: cart,
        customer_id: selectedCustomer?.id,
        payment_method: 'cash',
        amount_tendered: 0,
        discount_amount: parseFloat(discount) || 0,
        notes: notes || null,
    });

    const searchProducts = async () => {
        if (searchQuery.length < 1) {
            setSearchResults([]);
            return;
        }

        searchAbortControllerRef.current.abort();
        searchAbortControllerRef.current = new AbortController();

        setIsSearching(true);
        setSearchError(null);

        try {
            const response = await fetch(
                POSController.searchProducts.url({ shop: shop.id }) +
                    `?query=${encodeURIComponent(searchQuery)}`,
                { signal: searchAbortControllerRef.current.signal },
            );

            if (!response.ok) {
                throw new Error('Failed to search products');
            }

            const data = await response.json();
            setSearchResults(data.products || []);
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                setSearchError('Failed to search products. Please try again.');
            }
        } finally {
            setIsSearching(false);
        }
    };

    const searchCustomers = async () => {
        if (customerSearch.length < 1) {
            setCustomerResults([]);
            return;
        }

        customerSearchAbortControllerRef.current.abort();
        customerSearchAbortControllerRef.current = new AbortController();

        setIsSearchingCustomers(true);
        setCustomerSearchError(null);

        try {
            const response = await fetch(
                POSController.searchCustomers.url({ shop: shop.id }) +
                    `?query=${encodeURIComponent(customerSearch)}`,
                { signal: customerSearchAbortControllerRef.current.signal },
            );

            if (!response.ok) {
                throw new Error('Failed to search customers');
            }

            const data = await response.json();
            setCustomerResults(data.customers || []);
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                setCustomerSearchError(
                    'Failed to search customers. Please try again.',
                );
            }
        } finally {
            setIsSearchingCustomers(false);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(searchProducts, 300);
        return () => {
            clearTimeout(timer);
            searchAbortControllerRef.current.abort();
        };
    }, [searchQuery]);

    React.useEffect(() => {
        const timer = setTimeout(searchCustomers, 300);
        return () => {
            clearTimeout(timer);
            customerSearchAbortControllerRef.current.abort();
        };
    }, [customerSearch]);

    const addToCart = (product: Product) => {
        const existingItem = cart.find(
            (item) => item.variant_id === product.id,
        );

        if (existingItem) {
            setCart(
                cart.map((item) =>
                    item.variant_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                ),
            );
        } else {
            setCart([
                ...cart,
                {
                    variant_id: product.id,
                    name: product.product.name,
                    sku: product.sku,
                    quantity: 1,
                    unit_price: product.price,
                },
            ]);
        }

        setSearchQuery('');
        setSearchResults([]);
    };

    const updateQuantity = (variantId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(variantId);
            return;
        }

        setCart(
            cart.map((item) =>
                item.variant_id === variantId
                    ? { ...item, quantity: newQuantity }
                    : item,
            ),
        );
    };

    const removeFromCart = (variantId: number) => {
        setCart(cart.filter((item) => item.variant_id !== variantId));
    };

    const calculateSubtotal = () => {
        return cart.reduce(
            (sum, item) => sum + item.unit_price * item.quantity,
            0,
        );
    };

    const calculateTax = () => {
        if (!shop.vat_enabled) return 0;
        return calculateSubtotal() * (shop.vat_rate / 100);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const tax = calculateTax();
        const discountAmount = parseFloat(discount) || 0;
        return subtotal + tax - discountAmount;
    };

    const calculateChange = () => {
        if (form.data.payment_method !== 'cash') return 0;
        const tendered = form.data.amount_tendered || 0;
        const total = calculateTotal();
        return Math.max(0, tendered - total);
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        form.setData({
            items: [],
            customer_id: undefined,
            payment_method: 'cash',
            amount_tendered: 0,
            discount_amount: 0,
            notes: null,
        });
        setDiscount('');
        setNotes('');
    };

    const handleCompleteSale = (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            return;
        }

        const total = calculateTotal();

        if (
            form.data.payment_method === 'cash' &&
            form.data.amount_tendered < total
        ) {
            form.setError(
                'amount_tendered',
                'Amount tendered must be greater than or equal to total',
            );
            return;
        }

        form.transform((data) => ({
            ...data,
            items: cart,
            customer_id: selectedCustomer?.id,
            amount_tendered:
                data.payment_method === 'cash' ? data.amount_tendered : total,
            discount_amount: parseFloat(discount) || 0,
            notes: notes || null,
        })).post(POSController.completeSale.url({ shop: shop.id }), {
            onSuccess: () => {
                clearCart();
            },
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <Head title={`POS - ${shop.name}`} />

            <div className="flex h-[calc(100vh-4rem)] flex-col">
                <div className="bg-primary-600 flex items-center justify-between px-6 py-4 text-white">
                    <div>
                        <h1 className="text-2xl font-bold">{shop.name}</h1>
                        <p className="text-primary-100 text-sm">
                            Point of Sale
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-primary-100 text-sm">
                            Session Active
                        </p>
                        <p className="font-semibold">
                            {new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                </div>

                <div className="grid flex-1 grid-cols-12 gap-4 overflow-hidden p-4">
                    <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
                        <Card className="p-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                                {isSearching && (
                                    <Loader2 className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 animate-spin text-gray-400" />
                                )}
                                <Input
                                    type="text"
                                    placeholder="Search products by SKU, barcode, or name..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-10 pr-10"
                                />
                            </div>
                            {searchError && (
                                <InputError message={searchError} />
                            )}

                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="flex w-full items-center justify-between border-b px-4 py-3 last:border-b-0 hover:bg-gray-50"
                                        >
                                            <div className="text-left">
                                                <p className="font-medium">
                                                    {product.product.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    SKU: {product.sku}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-primary-600 font-bold">
                                                    {shop.currency_symbol}
                                                    {product.price.toFixed(2)}
                                                </p>
                                                {product.track_stock && (
                                                    <p className="text-xs text-gray-500">
                                                        Stock:{' '}
                                                        {product.stock_quantity}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className="flex flex-1 flex-col overflow-hidden">
                            <div className="border-b bg-gray-50 p-4">
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <ShoppingCart className="h-5 w-5" />
                                    Cart ({cart.length} items)
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {cart.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-gray-400">
                                        <ShoppingCart className="mb-4 h-16 w-16" />
                                        <p>Cart is empty</p>
                                        <p className="text-sm">
                                            Search and add products to cart
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cart.map((item) => (
                                            <div
                                                key={item.variant_id}
                                                className="rounded-lg border border-gray-200 bg-white p-4"
                                            >
                                                <div className="mb-2 flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            SKU: {item.sku}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeFromCart(
                                                                item.variant_id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4 text-error-500" />
                                                    </Button>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.variant_id,
                                                                    item.quantity -
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-12 text-center font-semibold">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.variant_id,
                                                                    item.quantity +
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">
                                                            {
                                                                shop.currency_symbol
                                                            }
                                                            {item.unit_price.toFixed(
                                                                2,
                                                            )}{' '}
                                                            each
                                                        </p>
                                                        <p className="text-primary-600 text-lg font-bold">
                                                            {
                                                                shop.currency_symbol
                                                            }
                                                            {(
                                                                item.unit_price *
                                                                item.quantity
                                                            ).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="col-span-5 flex flex-col gap-4">
                        <Card className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Customer
                                </Label>
                                {selectedCustomer && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setSelectedCustomer(null)
                                        }
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {selectedCustomer ? (
                                <div className="rounded-lg border border-success-200 bg-success-50 p-3">
                                    <p className="font-medium">
                                        {selectedCustomer.first_name}{' '}
                                        {selectedCustomer.last_name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {selectedCustomer.email}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Search customer..."
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(
                                                    e.target.value,
                                                );
                                                setShowCustomerSearch(true);
                                            }}
                                            onFocus={() =>
                                                setShowCustomerSearch(true)
                                            }
                                        />
                                        {isSearchingCustomers && (
                                            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                                        )}
                                    </div>
                                    {customerSearchError && (
                                        <InputError
                                            message={customerSearchError}
                                        />
                                    )}
                                    {showCustomerSearch &&
                                        customerResults.length > 0 && (
                                            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                                                {customerResults.map(
                                                    (customer) => (
                                                        <button
                                                            key={customer.id}
                                                            onClick={() => {
                                                                setSelectedCustomer(
                                                                    customer,
                                                                );
                                                                setCustomerSearch(
                                                                    '',
                                                                );
                                                                setShowCustomerSearch(
                                                                    false,
                                                                );
                                                                setCustomerResults(
                                                                    [],
                                                                );
                                                            }}
                                                            className="w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
                                                        >
                                                            <p className="text-sm font-medium">
                                                                {
                                                                    customer.first_name
                                                                }{' '}
                                                                {
                                                                    customer.last_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                {customer.email}
                                                            </p>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                </div>
                            )}
                        </Card>

                        <Card className="flex flex-1 flex-col p-4">
                            <form onSubmit={handleCompleteSale}>
                                <div className="mb-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">
                                            {shop.currency_symbol}
                                            {calculateSubtotal().toFixed(2)}
                                        </span>
                                    </div>

                                    {shop.vat_enabled && (
                                        <div className="flex justify-between text-sm">
                                            <span>Tax ({shop.vat_rate}%):</span>
                                            <span className="font-medium">
                                                {shop.currency_symbol}
                                                {calculateTax().toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Discount:
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={discount}
                                            onChange={(e) =>
                                                setDiscount(e.target.value)
                                            }
                                            className="w-32 text-right"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between border-t pt-3">
                                        <span className="text-xl font-bold">
                                            Total:
                                        </span>
                                        <span className="text-primary-600 text-2xl font-bold">
                                            {shop.currency_symbol}
                                            {calculateTotal().toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <Label>Payment Method</Label>
                                        <Select
                                            options={Object.entries(
                                                paymentMethods,
                                            ).map(([value, label]) => ({
                                                value,
                                                label,
                                            }))}
                                            value={form.data.payment_method}
                                            onChange={(value) =>
                                                form.setData(
                                                    'payment_method',
                                                    value,
                                                )
                                            }
                                        />
                                        {form.errors.payment_method && (
                                            <InputError
                                                message={
                                                    form.errors.payment_method
                                                }
                                            />
                                        )}
                                    </div>

                                    {form.data.payment_method === 'cash' && (
                                        <div>
                                            <Label>Amount Tendered</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={form.data.amount_tendered}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'amount_tendered',
                                                        parseFloat(
                                                            e.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                                min="0"
                                                step="0.01"
                                                error={
                                                    !!form.errors
                                                        .amount_tendered
                                                }
                                            />
                                            {form.errors.amount_tendered && (
                                                <InputError
                                                    message={
                                                        form.errors
                                                            .amount_tendered
                                                    }
                                                />
                                            )}
                                            {form.data.amount_tendered > 0 && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    Change:{' '}
                                                    <span className="font-semibold text-success-600">
                                                        {shop.currency_symbol}
                                                        {calculateChange().toFixed(
                                                            2,
                                                        )}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto space-y-2 pt-4">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        fullWidth
                                        size="lg"
                                        disabled={
                                            cart.length === 0 || form.processing
                                        }
                                        loading={form.processing}
                                        startIcon={<Check />}
                                    >
                                        Complete Sale
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        fullWidth
                                        onClick={clearCart}
                                        disabled={cart.length === 0}
                                        startIcon={<X />}
                                    >
                                        Clear Cart
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
