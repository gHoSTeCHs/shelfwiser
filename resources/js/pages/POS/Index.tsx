import { Head, router, Form } from '@inertiajs/react';
import React from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import POSController from '@/actions/App/Http/Controllers/POSController';
import { Shop } from '@/types/shop';
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    X,
    User,
    Check,
    DollarSign,
} from 'lucide-react';

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

/**
 * POS (Point of Sale) interface for quick retail checkout.
 * Optimized for speed with keyboard shortcuts and barcode scanning.
 */
const Index: React.FC<POSProps> = ({ shop, paymentMethods }) => {
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<Product[]>([]);
    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = React.useState('');
    const [customerResults, setCustomerResults] = React.useState<Customer[]>([]);
    const [paymentMethod, setPaymentMethod] = React.useState('cash');
    const [amountTendered, setAmountTendered] = React.useState('');
    const [discount, setDiscount] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [showCustomerSearch, setShowCustomerSearch] = React.useState(false);

    const searchProducts = async () => {
        if (searchQuery.length < 1) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(
                POSController.search.products.url({ shop: shop.id }) +
                    `?query=${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();
            setSearchResults(data.products || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const searchCustomers = async () => {
        if (customerSearch.length < 1) {
            setCustomerResults([]);
            return;
        }

        try {
            const response = await fetch(
                POSController.search.customers.url({ shop: shop.id }) +
                    `?query=${encodeURIComponent(customerSearch)}`
            );
            const data = await response.json();
            setCustomerResults(data.customers || []);
        } catch (error) {
            console.error('Customer search error:', error);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(searchProducts, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    React.useEffect(() => {
        const timer = setTimeout(searchCustomers, 300);
        return () => clearTimeout(timer);
    }, [customerSearch]);

    const addToCart = (product: Product) => {
        const existingItem = cart.find((item) => item.variant_id === product.id);

        if (existingItem) {
            setCart(
                cart.map((item) =>
                    item.variant_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
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
                item.variant_id === variantId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const removeFromCart = (variantId: number) => {
        setCart(cart.filter((item) => item.variant_id !== variantId));
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
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
        if (paymentMethod !== 'cash') return 0;
        const tendered = parseFloat(amountTendered) || 0;
        const total = calculateTotal();
        return Math.max(0, tendered - total);
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setAmountTendered('');
        setDiscount('');
        setNotes('');
    };

    const completeSale = () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        const total = calculateTotal();
        const tendered = parseFloat(amountTendered) || 0;

        if (paymentMethod === 'cash' && tendered < total) {
            alert('Amount tendered is less than total');
            return;
        }

        router.post(
            POSController.complete.url({ shop: shop.id }),
            {
                items: cart,
                customer_id: selectedCustomer?.id,
                payment_method: paymentMethod,
                amount_tendered: paymentMethod === 'cash' ? tendered : total,
                discount_amount: parseFloat(discount) || 0,
                notes: notes || null,
            },
            {
                onSuccess: () => {
                    clearCart();
                },
            }
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`POS - ${shop.name}`} />

            <div className="h-screen flex flex-col">
                <div className="bg-primary-600 text-white px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{shop.name}</h1>
                        <p className="text-sm text-primary-100">Point of Sale</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-primary-100">Session Active</p>
                        <p className="font-semibold">
                            {new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
                    <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
                        <Card className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    type="text"
                                    placeholder="Search products by SKU, barcode, or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                    autoFocus
                                />
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="w-full px-4 py-3 hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0"
                                        >
                                            <div className="text-left">
                                                <p className="font-medium">{product.product.name}</p>
                                                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary-600">
                                                    {shop.currency_symbol}
                                                    {product.price.toFixed(2)}
                                                </p>
                                                {product.track_stock && (
                                                    <p className="text-xs text-gray-500">
                                                        Stock: {product.stock_quantity}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-4 border-b bg-gray-50">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    Cart ({cart.length} items)
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <ShoppingCart className="w-16 h-16 mb-4" />
                                        <p>Cart is empty</p>
                                        <p className="text-sm">Search and add products to cart</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cart.map((item) => (
                                            <div
                                                key={item.variant_id}
                                                className="bg-white border border-gray-200 rounded-lg p-4"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-sm text-gray-600">
                                                            SKU: {item.sku}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFromCart(item.variant_id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-error-500" />
                                                    </Button>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.variant_id,
                                                                    item.quantity - 1
                                                                )
                                                            }
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </Button>
                                                        <span className="font-semibold w-12 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.variant_id,
                                                                    item.quantity + 1
                                                                )
                                                            }
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">
                                                            {shop.currency_symbol}
                                                            {item.unit_price.toFixed(2)} each
                                                        </p>
                                                        <p className="text-lg font-bold text-primary-600">
                                                            {shop.currency_symbol}
                                                            {(item.unit_price * item.quantity).toFixed(2)}
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
                            <div className="flex justify-between items-center mb-3">
                                <Label className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Customer
                                </Label>
                                {selectedCustomer && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedCustomer(null)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            {selectedCustomer ? (
                                <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                                    <p className="font-medium">
                                        {selectedCustomer.first_name} {selectedCustomer.last_name}
                                    </p>
                                    <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                                </div>
                            ) : (
                                <div>
                                    <Input
                                        type="text"
                                        placeholder="Search customer..."
                                        value={customerSearch}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerSearch(true);
                                        }}
                                        onFocus={() => setShowCustomerSearch(true)}
                                    />
                                    {showCustomerSearch && customerResults.length > 0 && (
                                        <div className="mt-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                            {customerResults.map((customer) => (
                                                <button
                                                    key={customer.id}
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setCustomerSearch('');
                                                        setShowCustomerSearch(false);
                                                        setCustomerResults([]);
                                                    }}
                                                    className="w-full px-3 py-2 hover:bg-gray-50 text-left border-b last:border-b-0"
                                                >
                                                    <p className="font-medium text-sm">
                                                        {customer.first_name} {customer.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {customer.email}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        <Card className="flex-1 p-4 flex flex-col">
                            <div className="space-y-3 mb-4">
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

                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Discount:</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        className="w-32 text-right"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="border-t pt-3 flex justify-between items-center">
                                    <span className="text-xl font-bold">Total:</span>
                                    <span className="text-2xl font-bold text-primary-600">
                                        {shop.currency_symbol}
                                        {calculateTotal().toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label>Payment Method</Label>
                                    <Select
                                        options={Object.entries(paymentMethods).map(([value, label]) => ({
                                            value,
                                            label,
                                        }))}
                                        value={paymentMethod}
                                        onChange={setPaymentMethod}
                                    />
                                </div>

                                {paymentMethod === 'cash' && (
                                    <div>
                                        <Label>Amount Tendered</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={amountTendered}
                                            onChange={(e) => setAmountTendered(e.target.value)}
                                            min="0"
                                            step="0.01"
                                        />
                                        {amountTendered && (
                                            <p className="mt-1 text-sm text-gray-600">
                                                Change:{' '}
                                                <span className="font-semibold text-success-600">
                                                    {shop.currency_symbol}
                                                    {calculateChange().toFixed(2)}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-4 space-y-2">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    onClick={completeSale}
                                    disabled={cart.length === 0}
                                    startIcon={<Check />}
                                >
                                    Complete Sale
                                </Button>
                                <Button
                                    variant="outline"
                                    fullWidth
                                    onClick={clearCart}
                                    disabled={cart.length === 0}
                                    startIcon={<X />}
                                >
                                    Clear Cart
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;
