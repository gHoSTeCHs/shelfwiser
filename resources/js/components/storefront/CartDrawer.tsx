import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import CheckoutController from '@/actions/App/Http/Controllers/Storefront/CheckoutController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Button from '@/components/ui/button/Button';
import useCart from '@/hooks/useCart';
import useCurrency from '@/hooks/useCurrency';
import { Shop } from '@/types/shop';
import { CartItem, CartSummary } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import CartDrawerItem from './CartDrawerItem';

interface CartDrawerProps {
    shop: Shop;
    cartItems: CartItem[];
    cartSummary: CartSummary;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
    shop,
    cartItems,
    cartSummary,
}) => {
    const { isDrawerOpen, closeDrawer } = useCart();
    const { formatCurrency } = useCurrency(shop);
    const drawerRef = useRef<HTMLDivElement>(null);

    const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDrawerOpen) {
                closeDrawer();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isDrawerOpen, closeDrawer]);

    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isDrawerOpen]);

    const transition = prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring' as const, damping: 25, stiffness: 200 };

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={
                            prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }
                        }
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        onClick={closeDrawer}
                        aria-hidden="true"
                    />

                    <motion.div
                        ref={drawerRef}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={transition}
                        className="fixed top-0 right-0 z-50 flex h-full w-full flex-col bg-white shadow-xl sm:w-96 dark:bg-navy-900"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Shopping cart"
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-navy-700">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-brand-500" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Your Cart
                                </h2>
                                {cartSummary.item_count > 0 && (
                                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                                        {cartSummary.item_count}{' '}
                                        {cartSummary.item_count === 1 ? 'item' : 'items'}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-navy-700 dark:hover:text-gray-200"
                                aria-label="Close cart"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {cartItems.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
                                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-navy-800">
                                    <ShoppingBag className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                                    Your cart is empty
                                </h3>
                                <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Looks like you haven't added anything yet.
                                </p>
                                <Link
                                    href={StorefrontController.products.url({
                                        shop: shop.slug,
                                    })}
                                    onClick={closeDrawer}
                                >
                                    <Button variant="primary" size="sm">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto px-4">
                                    <div className="divide-y divide-gray-100 dark:divide-navy-700">
                                        {cartItems.map((item) => (
                                            <CartDrawerItem
                                                key={item.id}
                                                item={item}
                                                shop={shop}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 p-4 dark:border-navy-700">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Subtotal
                                        </span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(cartSummary.subtotal)}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <Link
                                            href={CheckoutController.index.url({
                                                shop: shop.slug,
                                            })}
                                            onClick={closeDrawer}
                                            className="block"
                                        >
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                endIcon={<ArrowRight className="h-4 w-4" />}
                                            >
                                                Checkout
                                            </Button>
                                        </Link>

                                        <Link
                                            href={CartController.index.url({
                                                shop: shop.slug,
                                            })}
                                            onClick={closeDrawer}
                                            className="block"
                                        >
                                            <Button variant="outline" fullWidth>
                                                View Cart
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
