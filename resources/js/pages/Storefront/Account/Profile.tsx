import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountProfileProps } from '@/types/storefront';
import { Form } from '@inertiajs/react';
import React from 'react';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Button from '@/components/ui/button/Button';
import Checkbox from '@/components/form/input/Checkbox';
import { Card } from '@/components/ui/card';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';

/**
 * Customer profile management page.
 * Allows customers to update their personal information and preferences.
 */
const Profile: React.FC<AccountProfileProps> = ({ shop, customer, addresses }) => {
    return (
        <StorefrontLayout shop={shop} customer={customer}>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

                        <Form
                            action={CustomerPortalController.updateProfile.url({ shop: shop.slug })}
                            method="patch"
                        >
                            {({ errors, processing, data, setData }) => (
                                <>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="first_name">
                                                    First Name <span className="text-error-500">*</span>
                                                </Label>
                                                <Input
                                                    id="first_name"
                                                    name="first_name"
                                                    type="text"
                                                    value={data.first_name || customer.first_name}
                                                    onChange={(e) => setData('first_name', e.target.value)}
                                                    error={!!errors.first_name}
                                                    required
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
                                                    value={data.last_name || customer.last_name}
                                                    onChange={(e) => setData('last_name', e.target.value)}
                                                    error={!!errors.last_name}
                                                    required
                                                />
                                                <InputError message={errors.last_name} />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={customer.email}
                                                disabled
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Email cannot be changed. Contact support if you need to update it.
                                            </p>
                                        </div>

                                        <div>
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={data.phone || customer.phone || ''}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                error={!!errors.phone}
                                            />
                                            <InputError message={errors.phone} />
                                        </div>

                                        <div className="flex items-start">
                                            <Checkbox
                                                id="marketing_opt_in"
                                                checked={data.marketing_opt_in !== undefined
                                                    ? data.marketing_opt_in
                                                    : customer.marketing_opt_in}
                                                onChange={(e) => setData('marketing_opt_in', e.target.checked)}
                                            />
                                            <Label htmlFor="marketing_opt_in" className="ml-2 mb-0">
                                                Send me promotional emails and updates about new products and offers
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
                                </>
                            )}
                        </Form>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Saved Addresses</h2>

                        {addresses.length === 0 ? (
                            <div className="text-center py-8 text-gray-600">
                                <p>No saved addresses yet</p>
                                <p className="text-sm mt-2">
                                    Addresses will be saved automatically when you checkout
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {addresses.map((address) => (
                                    <div
                                        key={address.id}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <p className="font-semibold">
                                                        {address.first_name} {address.last_name}
                                                    </p>
                                                    {address.is_default && (
                                                        <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs rounded">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p>{address.address_line_1}</p>
                                                    {address.address_line_2 && (
                                                        <p>{address.address_line_2}</p>
                                                    )}
                                                    <p>
                                                        {address.city}, {address.state}{' '}
                                                        {address.postal_code}
                                                    </p>
                                                    <p>{address.country}</p>
                                                    {address.phone && (
                                                        <p className="mt-2">{address.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                                                {address.type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Account Information</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Account Created</span>
                                <span className="font-medium">
                                    {new Date(customer.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Email Verified</span>
                                <span className="font-medium">
                                    {customer.email_verified_at ? (
                                        <span className="text-success-600">✓ Verified</span>
                                    ) : (
                                        <span className="text-warning-600">Not verified</span>
                                    )}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-600">Account Status</span>
                                <span className="font-medium">
                                    {customer.is_active ? (
                                        <span className="text-success-600">Active</span>
                                    ) : (
                                        <span className="text-error-600">Inactive</span>
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
