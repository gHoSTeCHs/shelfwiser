import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { formatDateLong } from '@/lib/formatters';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountProfileProps } from '@/types/storefront';
import { Form } from '@inertiajs/react';
import React from 'react';

/**
 * Customer profile management page.
 * Allows customers to update their personal information and preferences.
 */
const Profile: React.FC<AccountProfileProps> = ({
    shop,
    customer,
    addresses,
}) => {
    return (
        <StorefrontLayout shop={shop} customer={customer}>
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-8 text-3xl font-bold text-gray-900">
                    My Profile
                </h1>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="mb-6 text-xl font-semibold">
                            Personal Information
                        </h2>

                        <Form
                            {...CustomerPortalController.updateProfile.form({
                                shop: shop.slug,
                            })}
                        >
                            {({ errors, processing }) => (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="first_name">
                                                First Name{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                type="text"
                                                defaultValue={
                                                    customer.first_name
                                                }
                                                error={!!errors.first_name}
                                                required
                                            />
                                            <InputError
                                                message={errors.first_name}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="last_name">
                                                Last Name{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                type="text"
                                                defaultValue={customer.last_name}
                                                error={!!errors.last_name}
                                                required
                                            />
                                            <InputError
                                                message={errors.last_name}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="email">
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={customer.email}
                                            disabled
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Email cannot be changed. Contact
                                            support if you need to update it.
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">
                                            Phone Number
                                        </Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            defaultValue={customer.phone || ''}
                                            error={!!errors.phone}
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="flex items-start">
                                        <Checkbox
                                            id="marketing_opt_in"
                                            name="marketing_opt_in"
                                            defaultChecked={
                                                customer.marketing_opt_in
                                            }
                                        />
                                        <Label
                                            htmlFor="marketing_opt_in"
                                            className="mb-0 ml-2"
                                        >
                                            Send me promotional emails and
                                            updates about new products and
                                            offers
                                        </Label>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={processing}
                                            loading={processing}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </Card>

                    <Card className="p-6">
                        <h2 className="mb-6 text-xl font-semibold">
                            Saved Addresses
                        </h2>

                        {addresses.length === 0 ? (
                            <div className="py-8 text-center text-gray-600">
                                <p>No saved addresses yet</p>
                                <p className="mt-2 text-sm">
                                    Addresses will be saved automatically when
                                    you checkout
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {addresses.map((address) => (
                                    <div
                                        key={address.id}
                                        className="rounded-lg border border-gray-200 p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <p className="font-semibold">
                                                        {address.first_name}{' '}
                                                        {address.last_name}
                                                    </p>
                                                    {address.is_default && (
                                                        <span className="rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p>
                                                        {address.address_line_1}
                                                    </p>
                                                    {address.address_line_2 && (
                                                        <p>
                                                            {
                                                                address.address_line_2
                                                            }
                                                        </p>
                                                    )}
                                                    <p>
                                                        {address.city},{' '}
                                                        {address.state}{' '}
                                                        {address.postal_code}
                                                    </p>
                                                    <p>{address.country}</p>
                                                    {address.phone && (
                                                        <p className="mt-2">
                                                            {address.phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 capitalize">
                                                {address.type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h2 className="mb-4 text-xl font-semibold">
                            Account Information
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Account Created
                                </span>
                                <span className="font-medium">
                                    {formatDateLong(customer.created_at)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Email Verified
                                </span>
                                <span className="font-medium">
                                    {customer.email_verified_at ? (
                                        <span className="text-success-600">
                                            ✓ Verified
                                        </span>
                                    ) : (
                                        <span className="text-warning-600">
                                            Not verified
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Account Status
                                </span>
                                <span className="font-medium">
                                    {customer.is_active ? (
                                        <span className="text-success-600">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="text-error-600">
                                            Inactive
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default Profile;
