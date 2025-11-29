import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import CustomerAuthController from '@/actions/App/Http/Controllers/Storefront/CustomerAuthController';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import FlashMessage from '@/components/FlashMessage';
import { initializeTheme, useAppearance } from '@/hooks/use-appearance';
import { Customer, Shop } from '@/types/storefront';
import { Form, Head, Link, router } from '@inertiajs/react';
import {
    LogOut,
    Monitor,
    Moon,
    Package,
    ShoppingCart,
    Sun,
    User,
} from 'lucide-react';
import React from 'react';

interface StorefrontLayoutProps {
    shop: Shop;
    customer?: Customer | null;
    cartItemCount?: number;
    children: React.ReactNode;
}

/**
 * Main layout component for customer-facing storefront pages.
 * Provides navigation, cart badge, and customer account menu.
 */
const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
    shop,
    customer,
    cartItemCount = 0,
    children,
}) => {
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [showThemeMenu, setShowThemeMenu] = React.useState(false);
    const [isNavigating, setIsNavigating] = React.useState(false);
    const { appearance, updateAppearance } = useAppearance();

    React.useEffect(() => {
        initializeTheme();
    }, []);

    React.useEffect(() => {
        const handleStart = () => setIsNavigating(true);
        const handleFinish = () => setIsNavigating(false);

        const startListener = router.on('start', handleStart);
        const finishListener = router.on('finish', handleFinish);

        return () => {
            startListener();
            finishListener();
        };
    }, []);

    const getThemeIcon = () => {
        if (appearance === 'light') return <Sun className="h-5 w-5" />;
        if (appearance === 'dark') return <Moon className="h-5 w-5" />;
        return <Monitor className="h-5 w-5" />;
    };

    return (
        <>
            <Head title={shop.name} />

            {isNavigating && (
                <div className="bg-primary-600 fixed top-0 right-0 left-0 z-[9999] h-1 animate-pulse" />
            )}

            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center space-x-8">
                                <Link
                                    href={StorefrontController.index.url({
                                        shop: shop.slug,
                                    })}
                                    className="text-base md:text-2xl font-bold text-gray-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                                >
                                    {shop.name}
                                </Link>

                                <nav className="hidden space-x-6 md:flex">
                                    <Link
                                        href={StorefrontController.index.url({
                                            shop: shop.slug,
                                        })}
                                        className="text-gray-700 transition-colors hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400"
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href={StorefrontController.products.url(
                                            { shop: shop.slug },
                                        )}
                                        className="text-gray-700 transition-colors hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400"
                                    >
                                        Products
                                    </Link>
                                    <Link
                                        href={StorefrontController.services.url(
                                            { shop: shop.slug },
                                        )}
                                        className="text-gray-700 transition-colors hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400"
                                    >
                                        Services
                                    </Link>
                                </nav>
                            </div>

                            <div className="flex items-center space-x-2">
                                {/* Theme Toggle */}
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowThemeMenu(!showThemeMenu)
                                        }
                                        className="rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                                        title="Change theme"
                                        aria-label="Theme settings"
                                    >
                                        {getThemeIcon()}
                                    </button>

                                    {showThemeMenu && (
                                        <div className="absolute right-0 z-50 mt-2 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
                                            <button
                                                onClick={() => {
                                                    updateAppearance('light');
                                                    setShowThemeMenu(false);
                                                }}
                                                className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <Sun className="h-4 w-4" />
                                                <span>Light</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    updateAppearance('dark');
                                                    setShowThemeMenu(false);
                                                }}
                                                className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <Moon className="h-4 w-4" />
                                                <span>Dark</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    updateAppearance('system');
                                                    setShowThemeMenu(false);
                                                }}
                                                className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                            >
                                                <Monitor className="h-4 w-4" />
                                                <span>System</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href={CartController.index.url({
                                        shop: shop.slug,
                                    })}
                                    className="relative rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                                >
                                    <ShoppingCart className="h-6 w-6" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white dark:bg-brand-500">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Link>

                                {customer ? (
                                    <div className="relative">
                                        <button
                                            onClick={() =>
                                                setShowUserMenu(!showUserMenu)
                                            }
                                            className="flex items-center space-x-2 rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                                        >
                                            <User className="h-6 w-6" />
                                            <span className="hidden md:block">
                                                {customer.first_name}
                                            </span>
                                        </button>

                                        {showUserMenu && (
                                            <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
                                                <Link
                                                    href={CustomerPortalController.dashboard.url(
                                                        { shop: shop.slug },
                                                    )}
                                                    className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4" />
                                                        <span>Dashboard</span>
                                                    </div>
                                                </Link>
                                                <Link
                                                    href={CustomerPortalController.orders.url(
                                                        { shop: shop.slug },
                                                    )}
                                                    className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <Package className="h-4 w-4" />
                                                        <span>My Orders</span>
                                                    </div>
                                                </Link>
                                                <Form
                                                    action={CustomerAuthController.logout.url(
                                                        { shop: shop.slug },
                                                    )}
                                                    method="post"
                                                >
                                                    {() => (
                                                        <button
                                                            type="submit"
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <LogOut className="h-4 w-4" />
                                                                <span>
                                                                    Logout
                                                                </span>
                                                            </div>
                                                        </button>
                                                    )}
                                                </Form>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href={CustomerAuthController.showLogin.url(
                                            { shop: shop.slug },
                                        )}
                                        className="rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <FlashMessage />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </main>

                <footer className="mt-12 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="text-center text-gray-600 dark:text-gray-400">
                            <p>
                                &copy; {new Date().getFullYear()} {shop.name}.
                                All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default StorefrontLayout;
