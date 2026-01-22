import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import CustomerAuthController from '@/actions/App/Http/Controllers/Storefront/CustomerAuthController';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import FlashMessage from '@/components/FlashMessage';
import { initializeTheme, useAppearance } from '@/hooks/use-appearance';
import { Customer } from '@/types/customer';
import { Shop } from '@/types/storefront';
import { Form, Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    LogOut,
    Menu,
    Monitor,
    Moon,
    Package,
    ShoppingCart,
    Sun,
    User,
    X,
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
 * Features playful-luxury design with mobile-first approach.
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
    const [showMobileMenu, setShowMobileMenu] = React.useState(false);
    const [isNavigating, setIsNavigating] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const { appearance, updateAppearance } = useAppearance();

    React.useEffect(() => {
        initializeTheme();
    }, []);

    // Track scroll position for header styling
    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus on route change
    React.useEffect(() => {
        const handleStart = () => {
            setIsNavigating(true);
            setShowMobileMenu(false);
            setShowUserMenu(false);
            setShowThemeMenu(false);
        };
        const handleFinish = () => setIsNavigating(false);

        const startListener = router.on('start', handleStart);
        const finishListener = router.on('finish', handleFinish);

        return () => {
            startListener();
            finishListener();
        };
    }, []);

    // Close menus when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-menu-container]')) {
                setShowUserMenu(false);
                setShowThemeMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const getThemeIcon = () => {
        if (appearance === 'light') return <Sun className="h-5 w-5" />;
        if (appearance === 'dark') return <Moon className="h-5 w-5" />;
        return <Monitor className="h-5 w-5" />;
    };

    const navLinks = [
        {
            href: StorefrontController.index.url({ shop: shop.slug }),
            label: 'Home',
        },
        {
            href: StorefrontController.products.url({ shop: shop.slug }),
            label: 'Products',
        },
        {
            href: StorefrontController.services.url({ shop: shop.slug }),
            label: 'Services',
        },
    ];

    return (
        <>
            <Head title={shop.name} />

            {/* Progress bar */}
            <AnimatePresence>
                {isNavigating && (
                    <motion.div
                        initial={{ scaleX: 0, opacity: 1 }}
                        animate={{ scaleX: 0.7, opacity: 1 }}
                        exit={{ scaleX: 1, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="fixed top-0 right-0 left-0 z-[9999] h-1 origin-left bg-gradient-to-r from-brand-500 to-brand-400"
                    />
                )}
            </AnimatePresence>

            <div className="min-h-screen bg-brand-25 dark:bg-navy-950">
                {/* Header */}
                <header
                    className={`sticky top-0 z-50 transition-all duration-300 ${
                        isScrolled
                            ? 'border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-navy-800/80 dark:bg-navy-900/95'
                            : 'bg-white dark:bg-navy-900'
                    }`}
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between md:h-18">
                            {/* Logo & Mobile Menu Button */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowMobileMenu(true)}
                                    className="rounded-xl p-2 text-gray-700 transition-all hover:bg-brand-50 hover:text-brand-600 md:hidden dark:text-gray-300 dark:hover:bg-navy-800 dark:hover:text-brand-400"
                                    aria-label="Open menu"
                                >
                                    <Menu className="h-6 w-6" />
                                </button>

                                <Link
                                    href={StorefrontController.index.url({
                                        shop: shop.slug,
                                    })}
                                    className="group flex items-center gap-2"
                                >
                                    <span className="text-xl font-bold text-gray-900 transition-colors group-hover:text-brand-600 md:text-2xl dark:text-white dark:group-hover:text-brand-400">
                                        {shop.name}
                                    </span>
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <nav className="hidden items-center gap-1 md:flex">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-brand-50 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-navy-800 dark:hover:text-brand-400"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>

                            {/* Right Actions */}
                            <div className="flex items-center gap-1">
                                {/* Theme Toggle */}
                                <div className="relative" data-menu-container>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowThemeMenu(!showThemeMenu);
                                            setShowUserMenu(false);
                                        }}
                                        className="rounded-xl p-2.5 text-gray-600 transition-all hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-navy-800 dark:hover:text-brand-400"
                                        title="Change theme"
                                        aria-label="Theme settings"
                                    >
                                        {getThemeIcon()}
                                    </button>

                                    <AnimatePresence>
                                        {showThemeMenu && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    y: 8,
                                                    scale: 0.95,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: 8,
                                                    scale: 0.95,
                                                }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-navy-700 dark:bg-navy-800"
                                            >
                                                {[
                                                    {
                                                        value: 'light' as const,
                                                        icon: Sun,
                                                        label: 'Light',
                                                    },
                                                    {
                                                        value: 'dark' as const,
                                                        icon: Moon,
                                                        label: 'Dark',
                                                    },
                                                    {
                                                        value: 'system' as const,
                                                        icon: Monitor,
                                                        label: 'System',
                                                    },
                                                ].map((theme) => (
                                                    <button
                                                        key={theme.value}
                                                        onClick={() => {
                                                            updateAppearance(
                                                                theme.value,
                                                            );
                                                            setShowThemeMenu(
                                                                false,
                                                            );
                                                        }}
                                                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                                            appearance ===
                                                            theme.value
                                                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                                                                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-700'
                                                        }`}
                                                    >
                                                        <theme.icon className="h-4 w-4" />
                                                        <span>
                                                            {theme.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Cart */}
                                <Link
                                    href={CartController.index.url({
                                        shop: shop.slug,
                                    })}
                                    className="relative rounded-xl p-2.5 text-gray-600 transition-all hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-navy-800 dark:hover:text-brand-400"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    <AnimatePresence>
                                        {cartItemCount > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white shadow-sm"
                                            >
                                                {cartItemCount > 99
                                                    ? '99+'
                                                    : cartItemCount}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>

                                {/* User Menu */}
                                {customer ? (
                                    <div
                                        className="relative"
                                        data-menu-container
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowUserMenu(!showUserMenu);
                                                setShowThemeMenu(false);
                                            }}
                                            className="flex items-center gap-2 rounded-xl p-2 text-gray-600 transition-all hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-navy-800 dark:hover:text-brand-400"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="hidden text-sm font-medium md:block">
                                                {customer.first_name}
                                            </span>
                                        </button>

                                        <AnimatePresence>
                                            {showUserMenu && (
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        y: 8,
                                                        scale: 0.95,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                        scale: 1,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        y: 8,
                                                        scale: 0.95,
                                                    }}
                                                    transition={{
                                                        duration: 0.15,
                                                    }}
                                                    className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-navy-700 dark:bg-navy-800"
                                                >
                                                    {/* User info header */}
                                                    <div className="border-b border-gray-100 px-4 py-3 dark:border-navy-700">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {
                                                                customer.first_name
                                                            }{' '}
                                                            {customer.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {customer.email}
                                                        </p>
                                                    </div>

                                                    <div className="py-1">
                                                        <Link
                                                            href={CustomerPortalController.dashboard.url(
                                                                {
                                                                    shop: shop.slug,
                                                                },
                                                            )}
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-700"
                                                        >
                                                            <User className="h-4 w-4" />
                                                            <span>
                                                                Dashboard
                                                            </span>
                                                        </Link>
                                                        <Link
                                                            href={CustomerPortalController.orders.url(
                                                                {
                                                                    shop: shop.slug,
                                                                },
                                                            )}
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-700"
                                                        >
                                                            <Package className="h-4 w-4" />
                                                            <span>
                                                                My Orders
                                                            </span>
                                                        </Link>
                                                    </div>

                                                    <div className="border-t border-gray-100 py-1 dark:border-navy-700">
                                                        <Form
                                                            action={CustomerAuthController.logout.url(
                                                                {
                                                                    shop: shop.slug,
                                                                },
                                                            )}
                                                            method="post"
                                                        >
                                                            {() => (
                                                                <button
                                                                    type="submit"
                                                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-700"
                                                                >
                                                                    <LogOut className="h-4 w-4" />
                                                                    <span>
                                                                        Logout
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </Form>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Link
                                        href={CustomerAuthController.showLogin.url(
                                            { shop: shop.slug },
                                        )}
                                        className="hidden rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-600 hover:shadow-[0_0_0_4px_rgba(232,111,66,0.12)] sm:block"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {showMobileMenu && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowMobileMenu(false)}
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
                            />
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{
                                    type: 'spring',
                                    damping: 25,
                                    stiffness: 200,
                                }}
                                className="fixed top-0 bottom-0 left-0 z-50 w-[280px] bg-white shadow-xl md:hidden dark:bg-navy-900"
                            >
                                <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4 dark:border-navy-800">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {shop.name}
                                    </span>
                                    <button
                                        onClick={() => setShowMobileMenu(false)}
                                        className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-navy-800"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <nav className="flex flex-col gap-1 p-4">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="rounded-xl px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-navy-800 dark:hover:text-brand-400"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>

                                {!customer && (
                                    <div className="border-t border-gray-100 p-4 dark:border-navy-800">
                                        <Link
                                            href={CustomerAuthController.showLogin.url(
                                                { shop: shop.slug },
                                            )}
                                            className="block rounded-xl bg-brand-500 px-4 py-3 text-center text-base font-medium text-white transition-all hover:bg-brand-600"
                                        >
                                            Login
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <FlashMessage />

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="mt-auto border-t border-gray-200 bg-white dark:border-navy-800 dark:bg-navy-900">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    {shop.name}
                                </span>
                            </div>

                            <nav className="flex flex-wrap justify-center gap-6">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="text-sm text-gray-600 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
