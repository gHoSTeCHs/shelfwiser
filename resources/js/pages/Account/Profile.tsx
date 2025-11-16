import StorefrontLayout from '@/layouts/StorefrontLayout';
import { AccountProfileProps } from '@/types/storefront';
import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Checkbox from '@/components/form/input/Checkbox';
import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import { User, MapPin, Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { FormEvent } from 'react';

/**
 * Customer profile and address management page.
 * Allows customers to update their information and manage addresses.
 */
const Profile: React.FC<AccountProfileProps> = ({
    shop,
    customer,
    addresses,
}) => {
    const [editingProfile, setEditingProfile] = useState(false);

    const profileForm = useForm({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
        marketing_opt_in: customer.marketing_opt_in || false,
    });

    const handleProfileSubmit = (e: FormEvent) => {
        e.preventDefault();

        profileForm.patch(
            CustomerPortalController.updateProfile.url({ shop: shop.slug }),
            {
                onSuccess: () => {
                    setEditingProfile(false);
                },
            },
        );
    };

    const getAddressTypeColor = (type: string) => {
        switch (type) {
            case 'shipping':
                return 'info';
            case 'billing':
                return 'warning';
            case 'both':
                return 'success';
            default:
                return 'light';
        }
    };

    const formatAddress = (
        address: any,
    ): string => {
        const parts = [
            address.address_line_1,
            address.address_line_2,
            address.city,
            address.state,
            address.postal_code,
            address.country,
        ].filter(Boolean);

        return parts.join(', ');
    };

    return (
        <StorefrontLayout shop={shop} customer={customer}>
            <Head title={`My Profile - ${shop.name}`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Profile
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Manage your personal information and addresses
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Personal Information">
                            {editingProfile ? (
                                <form onSubmit={handleProfileSubmit}>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="first_name">
                                                    First Name{' '}
                                                    <span className="text-error-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="first_name"
                                                    type="text"
                                                    value={
                                                        profileForm.data
                                                            .first_name
                                                    }
                                                    onChange={(e) =>
                                                        profileForm.setData(
                                                            'first_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={
                                                        !!profileForm.errors
                                                            .first_name
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        profileForm.errors
                                                            .first_name
                                                    }
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
                                                    type="text"
                                                    value={
                                                        profileForm.data
                                                            .last_name
                                                    }
                                                    onChange={(e) =>
                                                        profileForm.setData(
                                                            'last_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={
                                                        !!profileForm.errors
                                                            .last_name
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        profileForm.errors
                                                            .last_name
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={profileForm.data.phone}
                                                onChange={(e) =>
                                                    profileForm.setData(
                                                        'phone',
                                                        e.target.value,
                                                    )
                                                }
                                                error={
                                                    !!profileForm.errors.phone
                                                }
                                            />
                                            <InputError
                                                message={
                                                    profileForm.errors.phone
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="marketing_opt_in"
                                                checked={
                                                    profileForm.data
                                                        .marketing_opt_in
                                                }
                                                onChange={(e) =>
                                                    profileForm.setData(
                                                        'marketing_opt_in',
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="marketing_opt_in"
                                                className="mb-0 cursor-pointer"
                                            >
                                                Send me promotional emails and
                                                offers
                                            </Label>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    profileForm.processing
                                                }
                                            >
                                                {profileForm.processing
                                                    ? 'Saving...'
                                                    : 'Save Changes'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingProfile(false);
                                                    profileForm.reset();
                                                }}
                                                disabled={
                                                    profileForm.processing
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Full Name
                                                    </p>
                                                    <p className="font-medium text-gray-900">
                                                        {customer.first_name}{' '}
                                                        {customer.last_name}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Email
                                                    </p>
                                                    <p className="font-medium text-gray-900">
                                                        {customer.email}
                                                    </p>
                                                    {customer.email_verified_at && (
                                                        <Badge
                                                            color="success"
                                                            size="sm"
                                                            className="mt-1"
                                                        >
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {customer.phone && (
                                                <div className="flex items-center gap-3">
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            Phone
                                                        </p>
                                                        <p className="font-medium text-gray-900">
                                                            {customer.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {customer.marketing_opt_in && (
                                                <div className="pt-2">
                                                    <Badge
                                                        color="info"
                                                        size="sm"
                                                    >
                                                        Subscribed to
                                                        newsletters
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setEditingProfile(true)
                                            }
                                            startIcon={<Edit />}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Addresses */}
                        <Card
                            title="Saved Addresses"
                            description="Manage your shipping and billing addresses"
                        >
                            {addresses.length > 0 ? (
                                <div className="space-y-4">
                                    {addresses.map((address) => (
                                        <div
                                            key={address.id}
                                            className="p-4 border border-gray-200 rounded-lg"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium text-gray-900">
                                                            {address.first_name}{' '}
                                                            {address.last_name}
                                                        </span>
                                                        {address.is_default && (
                                                            <Badge
                                                                color="primary"
                                                                size="sm"
                                                            >
                                                                Default
                                                            </Badge>
                                                        )}
                                                        <Badge
                                                            color={getAddressTypeColor(
                                                                address.type,
                                                            )}
                                                            size="sm"
                                                        >
                                                            {address.type}
                                                        </Badge>
                                                    </div>

                                                    <div className="text-sm text-gray-600 space-y-1">
                                                        <p>
                                                            {
                                                                address.address_line_1
                                                            }
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
                                                                Phone:{' '}
                                                                {address.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 ml-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-error-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        variant="outline"
                                        fullWidth
                                        startIcon={<Plus />}
                                    >
                                        Add New Address
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-4 text-sm font-medium text-gray-900">
                                        No saved addresses
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Add your first address to save time at
                                        checkout.
                                    </p>
                                    <div className="mt-6">
                                        <Button startIcon={<Plus />}>
                                            Add Address
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Account Info */}
                        <Card title="Account Information">
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Member since</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(
                                            customer.created_at,
                                        ).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-gray-200">
                                    <p className="text-gray-500">Account ID</p>
                                    <p className="font-mono text-xs text-gray-900">
                                        #{customer.id}
                                    </p>
                                </div>

                                {customer.is_active ? (
                                    <div className="pt-3 border-t border-gray-200">
                                        <Badge color="success">
                                            Active Account
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="pt-3 border-t border-gray-200">
                                        <Badge color="error">
                                            Inactive Account
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Security */}
                        <Card title="Security">
                            <div className="space-y-3">
                                <Button variant="outline" fullWidth>
                                    Change Password
                                </Button>
                                <Button variant="outline" fullWidth>
                                    Enable 2FA
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default Profile;
