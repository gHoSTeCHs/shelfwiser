import CustomerPortalController from '@/actions/App/Http/Controllers/Storefront/CustomerPortalController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { formatDateLong } from '@/lib/formatters';
import { getAddressTypeColor } from '@/lib/status-configs';
import { AccountProfileProps } from '@/types/storefront';
import { Form, Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Edit,
    Lock,
    Mail,
    MapPin,
    Phone,
    Plus,
    Trash2,
    User,
} from 'lucide-react';
import React, { useState } from 'react';

/**
 * Customer profile with playful-luxury styling.
 */
const Profile: React.FC<AccountProfileProps> = ({
    shop,
    customer,
    addresses,
}) => {
    const [editingProfile, setEditingProfile] = useState(false);

    return (
        <StorefrontLayout shop={shop} customer={customer}>
            <Head title={`My Profile - ${shop.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                        My Profile
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your personal information and addresses
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    {/* Main Content */}
                    <div className="space-y-4 lg:col-span-2 lg:space-y-6">
                        {/* Personal Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-xl border border-gray-200 bg-white sm:rounded-2xl dark:border-navy-700 dark:bg-navy-800"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5 dark:border-navy-700">
                                <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                    <User className="h-4 w-4 text-brand-500" />
                                    Personal Information
                                </h2>
                                {!editingProfile && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingProfile(true)}
                                        startIcon={<Edit className="h-4 w-4" />}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>

                            <div className="p-4 sm:p-5">
                                {editingProfile ? (
                                    <Form
                                        {...CustomerPortalController.updateProfile.form(
                                            { shop: shop.slug },
                                        )}
                                        className="space-y-4"
                                        onSuccess={() =>
                                            setEditingProfile(false)
                                        }
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                                            error={
                                                                !!errors.first_name
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.first_name
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
                                                            name="last_name"
                                                            type="text"
                                                            defaultValue={
                                                                customer.last_name
                                                            }
                                                            error={
                                                                !!errors.last_name
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.last_name
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="phone">
                                                        Phone
                                                    </Label>
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        defaultValue={
                                                            customer.phone || ''
                                                        }
                                                        error={!!errors.phone}
                                                    />
                                                    <InputError
                                                        message={errors.phone}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id="marketing_opt_in"
                                                        name="marketing_opt_in"
                                                        defaultChecked={
                                                            customer.marketing_opt_in
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor="marketing_opt_in"
                                                        className="mb-0 cursor-pointer"
                                                    >
                                                        Send me promotional
                                                        emails and offers
                                                    </Label>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        {processing
                                                            ? 'Saving...'
                                                            : 'Save Changes'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setEditingProfile(
                                                                false,
                                                            )
                                                        }
                                                        disabled={processing}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-navy-700">
                                                <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Full Name
                                                </p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {customer.first_name}{' '}
                                                    {customer.last_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-navy-700">
                                                <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Email
                                                </p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {customer.email}
                                                </p>
                                                {customer.email_verified_at && (
                                                    <span className="mt-1 inline-block">
                                                        <Badge
                                                            color="success"
                                                            size="sm"
                                                        >
                                                            Verified
                                                        </Badge>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {customer.phone && (
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-navy-700">
                                                    <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Phone
                                                    </p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {customer.phone}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {customer.marketing_opt_in && (
                                            <Badge color="info" size="sm">
                                                Subscribed to newsletters
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Addresses */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="rounded-xl border border-gray-200 bg-white sm:rounded-2xl dark:border-navy-700 dark:bg-navy-800"
                        >
                            <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-navy-700">
                                <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                    <MapPin className="h-4 w-4 text-brand-500" />
                                    Saved Addresses
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage your shipping and billing addresses
                                </p>
                            </div>

                            <div className="p-4 sm:p-5">
                                {addresses.length > 0 ? (
                                    <div className="space-y-4">
                                        {addresses.map((address) => (
                                            <div
                                                key={address.id}
                                                className="rounded-xl border border-gray-200 p-4 dark:border-navy-700"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {
                                                                    address.first_name
                                                                }{' '}
                                                                {
                                                                    address.last_name
                                                                }
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

                                                        <div className="space-y-0.5 text-sm text-gray-600 dark:text-gray-400">
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
                                                                {
                                                                    address.postal_code
                                                                }
                                                            </p>
                                                            <p>
                                                                {
                                                                    address.country
                                                                }
                                                            </p>
                                                            {address.phone && (
                                                                <p className="mt-1 text-gray-500">
                                                                    {
                                                                        address.phone
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1">
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
                                            startIcon={
                                                <Plus className="h-4 w-4" />
                                            }
                                        >
                                            Add New Address
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <MapPin className="mx-auto h-10 w-10 text-gray-300 dark:text-navy-500" />
                                        <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                                            No saved addresses
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Add your first address to save time
                                            at checkout.
                                        </p>
                                        <div className="mt-4">
                                            <Button
                                                startIcon={
                                                    <Plus className="h-4 w-4" />
                                                }
                                            >
                                                Add Address
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 lg:space-y-6">
                        {/* Account Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800"
                        >
                            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
                                Account Information
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Member since
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {formatDateLong(customer.created_at)}
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 pt-3 dark:border-navy-700">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Account ID
                                    </p>
                                    <p className="font-mono text-xs text-gray-900 dark:text-white">
                                        #{customer.id}
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 pt-3 dark:border-navy-700">
                                    <Badge
                                        color={
                                            customer.is_active
                                                ? 'success'
                                                : 'error'
                                        }
                                    >
                                        {customer.is_active
                                            ? 'Active Account'
                                            : 'Inactive Account'}
                                    </Badge>
                                </div>
                            </div>
                        </motion.div>

                        {/* Security */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="rounded-xl border border-gray-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-navy-700 dark:bg-navy-800"
                        >
                            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                <Lock className="h-4 w-4 text-brand-500" />
                                Security
                            </h2>
                            <div className="space-y-3">
                                <Button variant="outline" fullWidth size="sm">
                                    Change Password
                                </Button>
                                <Button variant="outline" fullWidth size="sm">
                                    Enable 2FA
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
};

export default Profile;
