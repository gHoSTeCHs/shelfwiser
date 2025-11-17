import { Customer, Shop } from '@/types/storefront';
import { Head, Link, router } from '@inertiajs/react';
import { ShoppingCart, User, LogOut, Package } from 'lucide-react';
import React from 'react';
import FlashMessage from '@/components/FlashMessage';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import CustomerAuthController from '@/actions/App/Http/Controllers/Storefront/CustomerAuthController';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import { Form } from '@inertiajs/react';

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

    return (
        <>
            <Head title={shop.name} />

            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center space-x-8">
                                <Link
                                    href={StorefrontController.index.url({ shop: shop.slug })}
                                    className="text-2xl font-bold text-gray-900 hover:text-primary-600"
                                >
                                    {shop.name}
                                </Link>

                                <nav className="hidden md:flex space-x-6">
                                    <Link
                                        href={StorefrontController.index.url({ shop: shop.slug })}
                                        className="text-gray-700 hover:text-primary-600"
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href={StorefrontController.products.url({ shop: shop.slug })}
                                        className="text-gray-700 hover:text-primary-600"
                                    >
                                        Products
                                    </Link>
                                </nav>
                            </div>

                            <div className="flex items-center space-x-4">
                                <Link
                                    href={CartController.index.url({ shop: shop.slug })}
                                    className="relative p-2 text-gray-700 hover:text-primary-600"
                                >
                                    <ShoppingCart className="h-6 w-6" />
                                    {cartItemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </Link>

                                {customer ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-600"
                                        >
                                            <User className="h-6 w-6" />
                                            <span className="hidden md:block">
                                                {customer.first_name}
                                            </span>
                                        </button>

                                        {showUserMenu && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                                <Link
                                                    href={CustomerPortalController.dashboard.url({ shop: shop.slug })}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4" />
                                                        <span>Dashboard</span>
                                                    </div>
                                                </Link>
                                                <Link
                                                    href={CustomerPortalController.orders.url({ shop: shop.slug })}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <Package className="h-4 w-4" />
                                                        <span>My Orders</span>
                                                    </div>
                                                </Link>
                                                <Form
                                                    action={CustomerAuthController.logout.url({ shop: shop.slug })}
                                                    method="post"
                                                >
                                                    {() => (
                                                        <button
                                                            type="submit"
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <LogOut className="h-4 w-4" />
                                                                <span>Logout</span>
                                                            </div>
                                                        </button>
                                                    )}
                                                </Form>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href={CustomerAuthController.showLogin.url({ shop: shop.slug })}
                                        className="text-gray-700 hover:text-primary-600"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <FlashMessage />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>

                <footer className="bg-white border-t border-gray-200 mt-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="text-center text-gray-600">
                            <p>&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default StorefrontLayout;
