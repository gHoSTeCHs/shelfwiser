import type { FC } from 'react';
import type { FixedPageProps } from '../types/storefront';
import { CartPage } from './CartPage';
import { CheckoutPage } from './CheckoutPage';
import { CheckoutPendingPage } from './CheckoutPendingPage';
import { CheckoutSuccessPage } from './CheckoutSuccessPage';
import { ForgotPasswordPage } from './auth/ForgotPassword';
import { LoginPage } from './auth/Login';
import { RegisterPage } from './auth/Register';
import { ResetPasswordPage } from './auth/ResetPassword';
import { VerifyEmailPage } from './auth/VerifyEmail';

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
};
