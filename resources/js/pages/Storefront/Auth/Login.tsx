import CustomerAuthController from '@/actions/App/Http/Controllers/Storefront/CustomerAuthController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AuthLoginProps } from '@/types/storefront';
import { Form, Link } from '@inertiajs/react';
import React from 'react';

/**
 * Customer login page component.
 * Allows customers to authenticate and access their account.
 */
const Login: React.FC<AuthLoginProps> = ({ shop }) => {
    return (
        <StorefrontLayout shop={shop}>
            <div className="mx-auto max-w-md">
                <Card className="p-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome Back
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Sign in to your account to continue shopping
                        </p>
                    </div>

                    <Form
                        action={CustomerAuthController.login.url({
                            shop: shop.slug,
                        })}
                        method="post"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="email">
                                            Email Address{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="user@email.com"
                                            required
                                            // autoFocus
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <Label htmlFor="password">
                                            Password{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            error={!!errors.password}
                                            required
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center">
                                        <Checkbox
                                            id="remember"
                                            checked={false}
                                            onChange={() => {}}
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="mb-0 ml-2"
                                        >
                                            Remember me
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        fullWidth
                                        disabled={processing}
                                        loading={processing}
                                    >
                                        Sign In
                                    </Button>
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-600">
                                        Don't have an account?{' '}
                                        <Link
                                            href={CustomerAuthController.showRegister.url(
                                                { shop: shop.slug },
                                            )}
                                            className="text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
            </div>
        </StorefrontLayout>
    );
};

export default Login;
