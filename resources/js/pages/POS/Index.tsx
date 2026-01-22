import POSController from '@/actions/App/Http/Controllers/POSController';
import InputError from '@/components/form/InputError';
import {
    calculateChange as calcChange,
    calculateSubtotal as calcSubtotal,
    calculateTax as calcTax,
    calculateTotal as calcTotal,
} from '@/lib/calculations';
import Select from '@/components/form/Select';
import BarcodeScanner from '@/components/pos/BarcodeScanner';
import HeldSalesModal from '@/components/pos/HeldSalesModal';
import OfflineIndicator from '@/components/pos/OfflineIndicator';
import Button from '@/components/ui/button/Button';
import useCurrency from '@/hooks/useCurrency';
import useOfflinePOS from '@/hooks/useOfflinePOS';
import useOfflineProducts from '@/hooks/useOfflineProducts';
import useToast from '@/hooks/useToast.ts';
import { formatTime, formatDateShort } from '@/lib/formatters';
import AppLayout from '@/layouts/AppLayout.tsx';
import { CustomerBasic } from '@/types/customer';
import {
    HeldSale,
    HeldSaleCustomer,
    HeldSaleResponse,
} from '@/types/held-sale';
import { Shop } from '@/types/shop';
import { POSCartItem, SyncProduct } from '@/types/sync';
import { Head } from '@inertiajs/react';
import {
    Loader2,
    Minus,
    Pause,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    User,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface POSProps {
    shop: Shop;
    paymentMethods: Record<string, string>;
    heldSalesCount: number;
}

function Index({
    shop,
    paymentMethods,
    heldSalesCount: initialHeldSalesCount,
}: POSProps) {
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

    const {
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setCart,
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

    const [searchResults, setSearchResults] = useState<SyncProduct[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [selectedCustomer, setSelectedCustomer] =
        useState<CustomerBasic | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState<CustomerBasic[]>([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [customerSearchError, setCustomerSearchError] = useState<
        string | null
    >(null);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);

    const [discount, setDiscount] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountTendered, setAmountTendered] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const [heldSalesCount, setHeldSalesCount] = useState(initialHeldSalesCount);
    const [isHeldSalesModalOpen, setIsHeldSalesModalOpen] = useState(false);
    const [isHolding, setIsHolding] = useState(false);

    const customerSearchAbortControllerRef = useRef<AbortController>(
        new AbortController(),
    );
    const searchInputRef = useRef<HTMLInputElement>(null);
    const cartEndRef = useRef<HTMLDivElement>(null);

    const toast = useToast();
    const { formatCurrency } = useCurrency(shop);

    // Scroll to bottom of cart when items change
    useEffect(() => {
        if (cartEndRef.current) {
            cartEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [cart.length]);

    const fetchHeldSalesCount = useCallback(async () => {
        try {
            const response = await fetch(
                POSController.heldSalesCount.url({ shop: shop.id }),
            );
            if (response.ok) {
                const data = await response.json();
                setHeldSalesCount(data.count);
            }
        } catch {
            /** Silently fail - count is not critical */
        }
    }, [shop.id]);

    const handleSearch = async (query: string) => {
        if (query.length < 1) {
            setSearchResults([]);
            return;
        }

        setSearchError(null);

        try {
            const results = await searchProducts(query);
            setSearchResults(results);

            if (
                results.length === 1 &&
                (results[0].barcode === query || results[0].sku === query)
            ) {
                handleAddToCart(results[0]);
                setSearchResults([]);
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                setSearchError('Failed to search products. Please try again.');
            }
        }
    };

    const handleBarcodeScan = async (barcode: string) => {
        await handleSearch(barcode);
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
                toast.error('Failed to search customers');
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

    useEffect(() => {
        const timer = setTimeout(searchCustomers, 300);
        return () => {
            clearTimeout(timer);
            customerSearchAbortControllerRef.current.abort();
        };
    }, [customerSearch]);

    const handleAddToCart = (product: SyncProduct) => {
        addToCart(product);
        setSearchResults([]);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const subtotal = calcSubtotal(cart);
    const tax = shop.vat_enabled ? calcTax(cart, shop.vat_rate, true) : 0;
    const total = calcTotal(subtotal, { tax }, { discount: parseFloat(discount) || 0 });
    const change = paymentMethod === 'cash' ? calcChange(amountTendered || 0, total) : 0;

    const resetForm = () => {
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setAmountTendered(0);
        setDiscount('');
        setNotes('');
    };

    const handleClearCart = () => {
        clearCart();
        resetForm();
    };

    const handleHoldSale = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        if (!isOnline) {
            toast.error('Cannot hold sales while offline');
            return;
        }

        setIsHolding(true);

        try {
            const response = await fetch(
                POSController.holdSale.url({ shop: shop.id }),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart,
                        customer_id: selectedCustomer?.id || null,
                        notes: notes || null,
                    }),
                },
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to hold sale');
            }

            const data: HeldSaleResponse = await response.json();
            toast.success(data.message);

            clearCart();
            resetForm();
            setHeldSalesCount((prev) => prev + 1);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Failed to hold sale',
            );
        } finally {
            setIsHolding(false);
        }
    };

    const handleRetrieveHeldSale = (
        items: POSCartItem[],
        customer: HeldSaleCustomer | null,
    ) => {
        setCart(items);
        if (customer) {
            setSelectedCustomer({
                id: customer.id,
                first_name: customer.first_name,
                last_name: customer.last_name,
                email: customer.email || '',
                phone: customer.phone,
            });
        } else {
            setSelectedCustomer(null);
        }
        resetForm();
        setHeldSalesCount((prev) => Math.max(0, prev - 1));
        toast.info('Held sale restored to cart');
    };

    const handleHoldCurrentAndRetrieve = async (
        heldSaleToRetrieve: HeldSale,
    ) => {
        setIsHolding(true);

        try {
            const holdResponse = await fetch(
                POSController.holdSale.url({ shop: shop.id }),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart,
                        customer_id: selectedCustomer?.id || null,
                        notes: notes || null,
                    }),
                },
            );

            if (!holdResponse.ok) {
                const data = await holdResponse.json();
                throw new Error(data.error || 'Failed to hold current cart');
            }

            const holdData: HeldSaleResponse = await holdResponse.json();
            toast.success(
                `Current cart held as ${holdData.held_sale.hold_reference}`,
            );

            const retrieveResponse = await fetch(
                POSController.retrieveHeldSale.url({
                    shop: shop.id,
                    heldSale: heldSaleToRetrieve.id,
                }),
                { method: 'POST' },
            );

            if (!retrieveResponse.ok) {
                const data = await retrieveResponse.json();
                throw new Error(data.error || 'Failed to retrieve held sale');
            }

            const retrieveData: HeldSaleResponse =
                await retrieveResponse.json();

            setCart(retrieveData.held_sale.items);
            if (retrieveData.held_sale.customer) {
                setSelectedCustomer({
                    id: retrieveData.held_sale.customer.id,
                    first_name: retrieveData.held_sale.customer.first_name,
                    last_name: retrieveData.held_sale.customer.last_name,
                    email: retrieveData.held_sale.customer.email || '',
                    phone: retrieveData.held_sale.customer.phone,
                });
            } else {
                setSelectedCustomer(null);
            }
            resetForm();

            toast.success(`Loaded ${retrieveData.held_sale.hold_reference}`);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Failed to swap carts',
            );
            throw error;
        } finally {
            setIsHolding(false);
        }
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
                    toast.success(
                        `Sale queued for sync (ID: ${result.offlineId?.slice(-8)})`,
                    );
                } else {
                    toast.success(
                        `Sale completed! Order: ${result.orderNumber}`,
                    );
                }

                resetForm();
            } else {
                toast.error(result.error || 'Failed to complete sale');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSync = () => {
        syncProducts();
        syncPendingOrders();
        fetchHeldSalesCount();
    };

    return (
        <>
            <Head title={`POS - ${shop.name}`} />

            <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50 dark:bg-gray-950">
                {/* Header */}
                <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md">
                            <span className="text-lg font-bold">
                                {shop.name.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-lg leading-tight font-bold text-gray-900 dark:text-white">
                                {shop.name}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Point of Sale
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <OfflineIndicator
                            isOnline={isOnline}
                            pendingCount={pendingOrdersCount}
                            isSyncing={isSyncingProducts || isSyncingOrders}
                            lastSyncTime={lastSyncTime}
                            productCount={productCount}
                            onSync={handleSync}
                        />

                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

                        {heldSalesCount > 0 && (
                            <Button
                                onClick={() => setIsHeldSalesModalOpen(true)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
                            >
                                <Pause className="h-3.5 w-3.5" />
                                <span>{heldSalesCount} Held</span>
                            </Button>
                        )}

                        <div className="hidden text-right md:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatTime(new Date().toISOString())}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateShort(new Date().toISOString())}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Products & Search */}
                    <div className="flex w-full flex-col gap-4 border-r border-gray-200 bg-gray-50 p-4 md:w-7/12 lg:w-3/4 dark:border-gray-800 dark:bg-gray-950">
                        <div className="relative z-10">
                            <BarcodeScanner
                                onScan={handleBarcodeScan}
                                onError={(error) => setSearchError(error)}
                                placeholder="Scan barcode, SKU, or search product name..."
                                disabled={!isCartLoaded}
                                autoFocus={true}
                                showCameraButton={true}
                                className="w-full"
                            />
                            {searchError && (
                                <InputError
                                    message={searchError}
                                    className="mt-2"
                                />
                            )}
                        </div>

                        {/* Search Results / Product Grid */}
                        <div className="custom-scrollbar flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            {isSearchingProducts ? (
                                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                                    <Loader2 className="mb-2 h-8 w-8 animate-spin text-brand-500" />
                                    <p>Searching catalog...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div
                                    role="list"
                                    aria-label="Product search results"
                                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                >
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            role="listitem"
                                            onClick={() =>
                                                handleAddToCart(product)
                                            }
                                            aria-label={`Add ${product.display_name || product.product_name} to cart, ${formatCurrency(product.price)}`}
                                            className="group flex flex-col justify-between rounded-lg border border-gray-100 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-700"
                                        >
                                            <div className="mb-2 w-full">
                                                {product.image_url ? (
                                                    <div className="mb-3 aspect-square w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                                                        <img
                                                            src={
                                                                product.image_url
                                                            }
                                                            alt={
                                                                product.product_name
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-md bg-gray-100 text-gray-300 dark:bg-gray-700 dark:text-gray-600">
                                                        <ShoppingCart className="h-8 w-8" />
                                                    </div>
                                                )}
                                                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                                                    {product.display_name ||
                                                        product.product_name}
                                                </h3>
                                                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                                    SKU: {product.sku}
                                                </p>
                                            </div>
                                            <div className="flex w-full items-end justify-between">
                                                <div className="flex flex-col">
                                                    {product.track_stock && (
                                                        <span
                                                            className={`text-[10px] font-medium ${product.stock_quantity > 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}
                                                        >
                                                            {
                                                                product.stock_quantity
                                                            }{' '}
                                                            in stock
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                                                    {formatCurrency(product.price)}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
                                    <div className="mb-4 rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                                        <Search className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Start a Sale
                                    </h3>
                                    <p className="mt-1 max-w-xs text-sm">
                                        Scan a barcode or type to search for
                                        products to add to the cart.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Cart & Checkout */}
                    <div className="flex w-full flex-col bg-white shadow-xl md:w-5/12 lg:w-1/4 dark:bg-gray-900">
                        {/* Customer Section */}
                        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
                            {selectedCustomer ? (
                                <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50 p-3 dark:border-brand-900 dark:bg-brand-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-800 dark:text-brand-300">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                {selectedCustomer.first_name}{' '}
                                                {selectedCustomer.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {selectedCustomer.email ||
                                                    selectedCustomer.phone ||
                                                    'No contact info'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setSelectedCustomer(null)
                                        }
                                        aria-label={`Remove customer ${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
                                        className="h-8 w-8 p-0 text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Add customer..."
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
                                            aria-label="Search for customer"
                                            aria-autocomplete="list"
                                            aria-expanded={
                                                showCustomerSearch &&
                                                customerResults.length > 0
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 pr-4 pl-9 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                        {isSearchingCustomers && (
                                            <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                                        )}
                                    </div>

                                    {showCustomerSearch &&
                                        customerResults.length > 0 && (
                                            <div
                                                role="listbox"
                                                aria-label="Customer search results"
                                                className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                                            >
                                                <div className="custom-scrollbar max-h-60 overflow-y-auto">
                                                    {customerResults.map(
                                                        (customer) => (
                                                            <button
                                                                key={
                                                                    customer.id
                                                                }
                                                                role="option"
                                                                aria-selected={
                                                                    false
                                                                }
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
                                                                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                                                            >
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                                    <User className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {
                                                                            customer.first_name
                                                                        }{' '}
                                                                        {
                                                                            customer.last_name
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {customer.email ||
                                                                            customer.phone}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="custom-scrollbar flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-black/20">
                            {!isCartLoaded ? (
                                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                                    <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                                    <p className="text-sm">Loading cart...</p>
                                </div>
                            ) : cart.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400 opacity-60">
                                    <ShoppingCart
                                        className="mb-4 h-12 w-12"
                                        aria-hidden="true"
                                    />
                                    <p className="font-medium">Cart is empty</p>
                                </div>
                            ) : (
                                <div
                                    role="list"
                                    aria-label={`Shopping cart with ${cart.length} items`}
                                    className="space-y-3"
                                >
                                    {cart.map((item) => (
                                        <div
                                            key={item.variant_id}
                                            role="listitem"
                                            aria-label={`${item.name}, quantity ${item.quantity}, ${formatCurrency(item.unit_price * item.quantity)}`}
                                            className="group relative flex gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className="line-clamp-2 font-medium text-gray-900 dark:text-white">
                                                        {item.name}
                                                    </h4>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(item.unit_price * item.quantity)}
                                                    </p>
                                                </div>
                                                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                                                    {item.sku}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="flex h-8 items-center rounded-md border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
                                                        role="group"
                                                        aria-label={`Quantity controls for ${item.name}`}
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.variant_id,
                                                                    item.quantity -
                                                                        1,
                                                                )
                                                            }
                                                            aria-label={`Decrease quantity of ${item.name}`}
                                                            className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                                                        >
                                                            <Minus
                                                                className="h-3 w-3"
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                        <span
                                                            className="flex h-full w-10 items-center justify-center text-sm font-semibold text-gray-900 dark:text-white"
                                                            aria-live="polite"
                                                        >
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.variant_id,
                                                                    item.quantity +
                                                                        1,
                                                                )
                                                            }
                                                            aria-label={`Increase quantity of ${item.name}`}
                                                            className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                                                        >
                                                            <Plus
                                                                className="h-3 w-3"
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatCurrency(item.unit_price)} / unit
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    removeFromCart(
                                                        item.variant_id,
                                                    )
                                                }
                                                aria-label={`Remove ${item.name} from cart`}
                                                className="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-error-500 text-white shadow-md transition-all group-hover:flex hover:bg-error-600"
                                            >
                                                <X
                                                    className="h-3 w-3"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
                                    ))}
                                    <div ref={cartEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Totals & Actions */}
                        <div className="shadow-top border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                            {/* Calculation Details */}
                            <div className="mb-4 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {shop.vat_enabled && (
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Tax ({shop.vat_rate}%)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                                    <span>Discount</span>
                                    <div className="flex items-center gap-1 border-b border-gray-300 dark:border-gray-600">
                                        <span className="text-xs">
                                            {shop.currency_symbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) =>
                                                setDiscount(e.target.value)
                                            }
                                            placeholder="0.00"
                                            className="w-16 bg-transparent px-0 py-0 text-right text-sm outline-none focus:ring-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Total Display */}
                            <div className="mb-6 flex items-end justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                                <span className="text-base font-semibold text-gray-900 dark:text-white">
                                    Total
                                </span>
                                <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                                    {formatCurrency(total)}
                                </span>
                            </div>

                            {/* Payment Method */}
                            <div className="mb-4">
                                <Select
                                    options={Object.entries(paymentMethods).map(
                                        ([value, label]) => ({
                                            value,
                                            label,
                                        }),
                                    )}
                                    value={paymentMethod}
                                    onChange={(value) =>
                                        setPaymentMethod(value)
                                    }
                                    className="w-full"
                                />
                            </div>

                            {/* Cash Input if selected */}
                            {paymentMethod === 'cash' && (
                                <div className="mb-4">
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                                            {shop.currency_symbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={amountTendered || ''}
                                            onChange={(e) =>
                                                setAmountTendered(
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                                )
                                            }
                                            placeholder="Amount Tendered"
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white pr-4 pl-8 text-lg font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    {amountTendered > 0 && (
                                        <div className="mt-2 flex justify-between px-1 text-sm">
                                            <span className="text-gray-500">
                                                Change:
                                            </span>
                                            <span className="font-bold text-success-600 dark:text-success-400">
                                                {formatCurrency(change)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div
                                className="grid grid-cols-4 gap-2"
                                role="group"
                                aria-label="Cart actions"
                            >
                                <Button
                                    onClick={handleClearCart}
                                    variant="outline"
                                    aria-label="Clear cart"
                                    className="col-span-1 border-error-200 text-error-600 hover:bg-error-50 hover:text-error-700 dark:border-error-900 dark:text-error-400 dark:hover:bg-error-900/20"
                                    disabled={cart.length === 0}
                                >
                                    <Trash2
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                </Button>
                                <Button
                                    onClick={handleHoldSale}
                                    variant="outline"
                                    aria-label="Hold sale for later"
                                    className="col-span-1 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                    disabled={
                                        cart.length === 0 ||
                                        !isOnline ||
                                        isHolding
                                    }
                                    loading={isHolding}
                                >
                                    <Pause
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                </Button>
                                <Button
                                    onClick={handleCompleteSale}
                                    variant="primary"
                                    aria-label={`Complete payment of ${formatCurrency(total)}`}
                                    className="col-span-2 bg-brand-600 text-base font-semibold hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
                                    disabled={cart.length === 0 || isProcessing}
                                    loading={isProcessing}
                                >
                                    PAY {formatCurrency(total)}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <HeldSalesModal
                isOpen={isHeldSalesModalOpen}
                onClose={() => setIsHeldSalesModalOpen(false)}
                shop={shop}
                currentCart={cart}
                currentCustomer={selectedCustomer}
                onRetrieve={handleRetrieveHeldSale}
                onHoldCurrentAndRetrieve={handleHoldCurrentAndRetrieve}
            />
        </>
    );
};

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default Index;
