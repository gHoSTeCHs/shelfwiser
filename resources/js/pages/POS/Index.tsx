import POSController from '@/actions/App/Http/Controllers/POSController';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import BarcodeScanner from '@/components/pos/BarcodeScanner';
import OfflineIndicator from '@/components/pos/OfflineIndicator';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import useOfflinePOS from '@/hooks/useOfflinePOS';
import useOfflineProducts from '@/hooks/useOfflineProducts';
import useToast from '@/hooks/useToast.ts';
import AppLayout from '@/layouts/AppLayout.tsx';
import { Shop } from '@/types/shop';
import { SyncProduct } from '@/types/sync';
import { Head } from '@inertiajs/react';
import {
    Check,
    Loader2,
    Minus,
    Plus,
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

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
}

const Index: React.FC<POSProps> = ({ shop, paymentMethods }) => {
    // Offline products hook
    const {
        searchProducts,
        isSearching: isSearchingProducts,
        syncProducts,
        isSyncing: isSyncingProducts,
        lastSyncTime,
        productCount,
        isOnline,
    } = useOfflineProducts({
        shopId: shop.id,
        tenantId: shop.tenant_id,
        autoSync: true,
    });

    // Offline POS hook (cart management + offline orders)
    const {
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        completeSale,
        pendingOrdersCount,
        syncPendingOrders,
        isSyncing: isSyncingOrders,
        isCartLoaded,
    } = useOfflinePOS({
        shopId: shop.id,
        tenantId: shop.tenant_id,
        onOrderSynced: (offlineId, orderId, orderNumber) => {
            toast.success(`Order ${orderNumber} synced successfully`);
        },
        onSyncError: (offlineId, error) => {
            toast.error(`Failed to sync order: ${error}`);
        },
    });

    const [searchResults, setSearchResults] = React.useState<SyncProduct[]>([]);
    const [searchError, setSearchError] = React.useState<string | null>(null);

    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = React.useState('');
    const [customerResults, setCustomerResults] = React.useState<Customer[]>([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = React.useState(false);
    const [customerSearchError, setCustomerSearchError] = React.useState<string | null>(null);
    const [showCustomerSearch, setShowCustomerSearch] = React.useState(false);

    const [discount, setDiscount] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('cash');
    const [amountTendered, setAmountTendered] = React.useState(0);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const customerSearchAbortControllerRef = React.useRef<AbortController>(new AbortController());
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    const toast = useToast();

    // Handle barcode scan or search query
    const handleSearch = async (query: string) => {
        if (query.length < 1) {
            setSearchResults([]);
            return;
        }

        setSearchError(null);

        try {
            const results = await searchProducts(query);
            setSearchResults(results);

            // If exact match (barcode/SKU), auto-add to cart
            if (results.length === 1 && (results[0].barcode === query || results[0].sku === query)) {
                handleAddToCart(results[0]);
                setSearchResults([]);
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                setSearchError('Failed to search products. Please try again.');
            }
        }
    };

    // Handle barcode scan
    const handleBarcodeScan = async (barcode: string) => {
        console.log('[POS] Barcode scanned:', barcode);
        await handleSearch(barcode);
    };

    // Customer search
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
                toast.error('Failed to search customers');
            }

            const data = await response.json();
            setCustomerResults(data.customers || []);
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                setCustomerSearchError('Failed to search customers. Please try again.');
            }
        } finally {
            setIsSearchingCustomers(false);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(searchCustomers, 300);
        return () => {
            clearTimeout(timer);
            customerSearchAbortControllerRef.current.abort();
        };
    }, [customerSearch]);

    const handleAddToCart = (product: SyncProduct) => {
        addToCart(product);
        setSearchResults([]);
        // Focus back on scanner input
        setTimeout(() => searchInputRef.current?.focus(), 100);
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
        const tendered = amountTendered || 0;
        const total = calculateTotal();
        return Math.max(0, tendered - total);
    };

    const handleClearCart = () => {
        clearCart();
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setAmountTendered(0);
        setDiscount('');
        setNotes('');
    };

    const handleCompleteSale = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await completeSale({
                customerId: selectedCustomer?.id || null,
                paymentMethod,
                amountTendered: amountTendered || 0,
                discount: parseFloat(discount) || 0,
                notes: notes || '',
                taxRate: shop.vat_rate || 0,
                taxEnabled: shop.vat_enabled || false,
            });

            if (result.success) {
                if (result.isOffline) {
                    toast.success(`Sale queued for sync (ID: ${result.offlineId?.slice(-8)})`);
                } else {
                    toast.success(`Sale completed! Order: ${result.orderNumber}`);
                }

                // Reset form
                setSelectedCustomer(null);
                setPaymentMethod('cash');
                setAmountTendered(0);
                setDiscount('');
                setNotes('');
            } else {
                toast.error(result.error || 'Failed to complete sale');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSync = () => {
        syncProducts();
        syncPendingOrders();
    };

    return (
        <>
            <Head title={`POS - ${shop.name}`} />

            <div className="flex h-[calc(100vh-4rem)] flex-col">
                {/* Header */}
                <div className="flex items-center justify-between bg-brand-600 px-6 py-4 text-white shadow-theme-md dark:bg-brand-700">
                    <div>
                        <h1 className="text-2xl font-bold">{shop.name}</h1>
                        <p className="text-sm text-brand-100 dark:text-brand-200">
                            Point of Sale
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Offline indicator */}
                        <OfflineIndicator
                            isOnline={isOnline}
                            pendingCount={pendingOrdersCount}
                            isSyncing={isSyncingProducts || isSyncingOrders}
                            lastSyncTime={lastSyncTime}
                            productCount={productCount}
                            onSync={handleSync}
                        />
                        <div className="text-right">
                            <p className="text-sm text-brand-100 dark:text-brand-200">
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
                </div>

                <div className="grid flex-1 grid-cols-12 gap-4 bg-gray-50 p-4 dark:bg-gray-950">
                    {/* Left Panel - Product Search & Cart */}
                    <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
                        {/* Barcode Scanner / Search Bar */}
                        <Card className="border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                            <BarcodeScanner
                                onScan={handleBarcodeScan}
                                onError={(error) => setSearchError(error)}
                                placeholder="Scan barcode or search by SKU, name..."
                                disabled={!isCartLoaded}
                                autoFocus={true}
                                showCameraButton={true}
                            />

                            {searchError && <InputError message={searchError} />}

                            {/* Search loading indicator */}
                            {isSearchingProducts && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Searching...</span>
                                </div>
                            )}

                            {/* Search results dropdown */}
                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 shadow-theme-sm dark:border-gray-700">
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => handleAddToCart(product)}
                                            className="flex w-full items-center justify-between border-b border-gray-100 bg-white px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                                        >
                                            <div className="text-left">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {product.display_name || product.product_name}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    SKU: {product.sku}
                                                    {product.barcode && ` | Barcode: ${product.barcode}`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-brand-600 dark:text-brand-400">
                                                    {shop.currency_symbol}
                                                    {Number(product.price).toFixed(2)}
                                                </p>
                                                {product.track_stock && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Stock: {product.stock_quantity}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Cart */}
                        <Card className="flex flex-1 flex-col overflow-hidden border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <ShoppingCart className="h-5 w-5" />
                                    Cart ({cart.length} items)
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {!isCartLoaded ? (
                                    <div className="flex h-full flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                                        <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                                        <p className="text-sm">Loading cart...</p>
                                    </div>
                                ) : cart.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                                        <ShoppingCart className="mb-4 h-16 w-16" />
                                        <p className="font-medium">Cart is empty</p>
                                        <p className="text-sm">Scan a barcode to add products</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cart.map((item) => (
                                            <div
                                                key={item.variant_id}
                                                className="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs transition-shadow hover:shadow-theme-sm dark:border-gray-700 dark:bg-gray-800"
                                            >
                                                <div className="mb-3 flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            SKU: {item.sku}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFromCart(item.variant_id)}
                                                        className="hover:bg-error-50 dark:hover:bg-error-500/10"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-error-500 dark:text-error-400" />
                                                    </Button>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                                                            className="border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                        >
                                                            <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                                        </Button>
                                                        <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                                                            className="border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                        >
                                                            <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {shop.currency_symbol}
                                                            {Number(item.unit_price).toFixed(2)} each
                                                        </p>
                                                        <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                                                            {shop.currency_symbol}
                                                            {(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}
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

                    {/* Right Panel - Customer & Checkout */}
                    <div className="col-span-5 flex flex-col gap-4">
                        {/* Customer Selection */}
                        <Card className="border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="mb-3 flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-gray-900 dark:text-white">
                                    <User className="h-4 w-4" />
                                    Customer
                                </Label>
                                {selectedCustomer && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedCustomer(null)}
                                        className="hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    </Button>
                                )}
                            </div>

                            {selectedCustomer ? (
                                <div className="rounded-lg border border-success-200 bg-success-50 p-3 dark:border-success-800 dark:bg-success-950">
                                    <p className="font-medium text-success-900 dark:text-success-100">
                                        {selectedCustomer.first_name} {selectedCustomer.last_name}
                                    </p>
                                    <p className="text-sm text-success-700 dark:text-success-300">
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
                                                setCustomerSearch(e.target.value);
                                                setShowCustomerSearch(true);
                                            }}
                                            onFocus={() => setShowCustomerSearch(true)}
                                            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                                        />
                                        {isSearchingCustomers && (
                                            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400 dark:text-gray-500" />
                                        )}
                                    </div>
                                    {customerSearchError && <InputError message={customerSearchError} />}
                                    {showCustomerSearch && customerResults.length > 0 && (
                                        <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 shadow-theme-sm dark:border-gray-700">
                                            {customerResults.map((customer) => (
                                                <button
                                                    key={customer.id}
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setCustomerSearch('');
                                                        setShowCustomerSearch(false);
                                                        setCustomerResults([]);
                                                    }}
                                                    className="w-full border-b border-gray-100 bg-white px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                                                >
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {customer.first_name} {customer.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        {customer.email}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Checkout Panel */}
                        <Card className="flex flex-1 flex-col border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                            {/* Summary */}
                            <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {shop.currency_symbol}
                                        {calculateSubtotal().toFixed(2)}
                                    </span>
                                </div>

                                {shop.vat_enabled && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Tax ({shop.vat_rate}%):
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {shop.currency_symbol}
                                            {calculateTax().toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Discount:</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        className="w-32 border-gray-300 bg-white text-right text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">Total:</span>
                                    <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                                        {shop.currency_symbol}
                                        {calculateTotal().toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-gray-900 dark:text-white">Payment Method</Label>
                                    <Select
                                        options={Object.entries(paymentMethods).map(([value, label]) => ({
                                            value,
                                            label,
                                        }))}
                                        value={paymentMethod}
                                        onChange={(value) => setPaymentMethod(value)}
                                    />
                                </div>

                                {paymentMethod === 'cash' && (
                                    <div>
                                        <Label className="text-gray-900 dark:text-white">Amount Tendered</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={amountTendered}
                                            onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="0.01"
                                            className="border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        />
                                        {amountTendered > 0 && (
                                            <div className="mt-2 rounded-lg border border-success-200 bg-success-50 p-3 dark:border-success-800 dark:bg-success-950">
                                                <p className="text-sm text-success-700 dark:text-success-300">
                                                    Change:{' '}
                                                    <span className="font-semibold text-success-600 dark:text-success-400">
                                                        {shop.currency_symbol}
                                                        {calculateChange().toFixed(2)}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-auto space-y-2 pt-4">
                                <Button
                                    type="button"
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    disabled={cart.length === 0 || isProcessing}
                                    loading={isProcessing}
                                    onClick={handleCompleteSale}
                                    startIcon={<Check />}
                                    className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
                                >
                                    {isOnline ? 'Complete Sale' : 'Complete Sale (Offline)'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    fullWidth
                                    onClick={handleClearCart}
                                    disabled={cart.length === 0}
                                    startIcon={<X />}
                                    className="border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                                >
                                    Clear Cart
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default Index;
