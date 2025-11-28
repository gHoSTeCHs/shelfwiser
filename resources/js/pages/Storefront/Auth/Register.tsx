import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AuthRegisterProps } from '@/types/storefront';
import { Form, Link } from '@inertiajs/react';
import React from 'react';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Button from '@/components/ui/button/Button';
import Checkbox from '@/components/form/input/Checkbox';
import { Card } from '@/components/ui/card';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import CustomerAuthController from '@/actions/App/Http/Controllers/Storefront/CustomerAuthController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';

/**
 * Customer registration page component.
 * Allows new customers to create an account.
 */
const Register: React.FC<AuthRegisterProps> = ({ shop }) => {
    return (
        <StorefrontLayout shop={shop}>
            <Breadcrumbs
                items={[
                    { label: 'Home', href: StorefrontController.index.url({ shop: shop.slug }) },
                    { label: 'Register' },
                ]}
            />

            <div className="max-w-md mx-auto mt-6">
                <Card className="p-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                        <p className="mt-2 text-gray-600">
                            Join us and start shopping today
                        </p>
                    </div>

                    <Form
                        action={CustomerAuthController.register.url({ shop: shop.slug })}
                        method="post"
                    >
                        {({ errors, processing, data, setData }) => (
                            <>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="first_name">
                                                First Name <span className="text-error-500">*</span>
                                            </Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                type="text"
                                                value={data.first_name || ''}
                                                onChange={(e) => setData('first_name', e.target.value)}
                                                error={!!errors.first_name}
                                                required
                                                autoFocus
                                            />
                                            <InputError message={errors.first_name} />
                                        </div>

                                        <div>
                                            <Label htmlFor="last_name">
                                                Last Name <span className="text-error-500">*</span>
                                            </Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                type="text"
                                                value={data.last_name || ''}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                error={!!errors.last_name}
                                                required
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="email">
                                            Email Address <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={data.email || ''}
                                            onChange={(e) => setData('email', e.target.value)}
                                            error={!!errors.email}
                                            required
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={data.phone || ''}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            error={!!errors.phone}
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div>
                                        <Label htmlFor="password">
                                            Password <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={data.password || ''}
                                            onChange={(e) => setData('password', e.target.value)}
                                            error={!!errors.password}
                                            required
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div>
                                        <Label htmlFor="password_confirmation">
                                            Confirm Password <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation || ''}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            error={!!errors.password_confirmation}
                                            required
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>

                                    <div className="flex items-start">
                                        <Checkbox
                                            id="marketing_opt_in"
                                            checked={data.marketing_opt_in || false}
                                            onChange={(e) => setData('marketing_opt_in', e.target.checked)}
                                        />
                                        <Label htmlFor="marketing_opt_in" className="ml-2 mb-0">
                                            Send me promotional emails and updates
                                        </Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        fullWidth
                                        disabled={processing}
                                        loading={processing}
                                    >
                                        Create Account
                                    </Button>
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-600">
                                        Already have an account?{' '}
                                        <Link
                                            href={CustomerAuthController.showLogin.url({ shop: shop.slug })}
                                            className="text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Sign in
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

export default Register;
