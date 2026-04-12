import type { FC } from 'react';
import type { FixedPageProps } from '../types/storefront';
import { CartPage } from './CartPage';
import { CheckoutPage } from './CheckoutPage';
import { CheckoutPendingPage } from './CheckoutPendingPage';
import { CheckoutSuccessPage } from './CheckoutSuccessPage';
import { DashboardPage } from './account/DashboardPage';
import { OrderDetailPage } from './account/OrderDetailPage';
import { OrdersPage } from './account/OrdersPage';
import { ProfilePage } from './account/ProfilePage';
import { ForgotPasswordPage } from './auth/ForgotPassword';
import { LoginPage } from './auth/Login';
import { RegisterPage } from './auth/Register';
import { ResetPasswordPage } from './auth/ResetPassword';
import { VerifyEmailPage } from './auth/VerifyEmail';
import { ProductDetailPage } from './products/ProductDetailPage';
import { ServiceDetailPage } from './services/ServiceDetailPage';
import { ServiceListingPage } from './services/ServiceListingPage';

export const fixedPageRegistry: Record<string, FC<FixedPageProps>> = {
    cart: CartPage,
    checkout: CheckoutPage,
    'checkout-success': CheckoutSuccessPage,
    'checkout-pending': CheckoutPendingPage,
    login: LoginPage,
    register: RegisterPage,
    'forgot-password': ForgotPasswordPage,
    'reset-password': ResetPasswordPage,
    'verify-email': VerifyEmailPage,
    'account-dashboard': DashboardPage,
    'account-orders': OrdersPage,
    'account-order-detail': OrderDetailPage,
    'account-profile': ProfilePage,
    services: ServiceListingPage,
    'service-detail': ServiceDetailPage,
    'product-detail': ProductDetailPage,
};
