import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import Badge from '@/components/ui/badge/Badge';
import InputField from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, Form, router } from '@inertiajs/react';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import type { CustomerEditPageProps, UpdateCustomerFormData } from '@/types/customer';

export default function Edit({ customer, shops }: CustomerEditPageProps) {
    const primaryAddress = customer.addresses?.find((a) => a.is_default) || customer.addresses?.[0];

    const [formData, setFormData] = useState<UpdateCustomerFormData>({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone || '',
        address: {
            street: primaryAddress?.street || '',
            city: primaryAddress?.city || '',
            state: primaryAddress?.state || '',
            postal_code: primaryAddress?.postal_code || '',
        },
        preferred_shop_id: customer.preferred_shop_id,
        is_active: customer.is_active,
        marketing_opt_in: customer.marketing_opt_in,
        credit_limit: customer.credit_limit || '',
    });

    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

    const handleInputChange = (field: string, value: string | boolean | number | null) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddressChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: value,
            },
        }));
    };

    const handleStatusChange = (checked: boolean) => {
        if (!checked && customer.is_active) {
            setShowDeactivateConfirm(true);
        } else {
            handleInputChange('is_active', checked);
            setShowDeactivateConfirm(false);
        }
    };

    const confirmDeactivate = () => {
        handleInputChange('is_active', false);
        setShowDeactivateConfirm(false);
    };

    return (
        <>
            <Head title={`Edit ${customer.full_name}`} />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={CustomerController.show.url({ customer: customer.id })}
                        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Customer
                    </Link>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Edit Customer
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Update {customer.full_name}'s account details
                        </p>
                    </div>
                    <Badge variant="light" color={customer.is_active ? 'success' : 'error'}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                <Form
                    action={CustomerController.update.url({ customer: customer.id })}
                    method="put"
                >
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            <Card title="Personal Information">
                                <div className="space-y-6 p-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="first_name">First Name</Label>
                                            <InputField
                                                id="first_name"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={(e) => handleInputChange('first_name', e.target.value)}
                                                error={!!errors.first_name}
                                            />
                                            <InputError message={errors.first_name} />
                                        </div>

                                        <div>
                                            <Label htmlFor="last_name">Last Name</Label>
                                            <InputField
                                                id="last_name"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={(e) => handleInputChange('last_name', e.target.value)}
                                                error={!!errors.last_name}
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="email">Email Address</Label>
                                            <InputField
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                error={!!errors.email}
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div>
                                            <Label htmlFor="phone">Phone</Label>
                                            <InputField
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                error={!!errors.phone}
                                            />
                                            <InputError message={errors.phone} />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Address">
                                <div className="space-y-6 p-6">
                                    <div>
                                        <Label htmlFor="address.street">Street Address</Label>
                                        <InputField
                                            id="address.street"
                                            name="address[street]"
                                            value={formData.address.street}
                                            onChange={(e) => handleAddressChange('street', e.target.value)}
                                            error={!!errors['address.street']}
                                        />
                                        <InputError message={errors['address.street']} />
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-3">
                                        <div>
                                            <Label htmlFor="address.city">City</Label>
                                            <InputField
                                                id="address.city"
                                                name="address[city]"
                                                value={formData.address.city}
                                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                                error={!!errors['address.city']}
                                            />
                                            <InputError message={errors['address.city']} />
                                        </div>

                                        <div>
                                            <Label htmlFor="address.state">State</Label>
                                            <InputField
                                                id="address.state"
                                                name="address[state]"
                                                value={formData.address.state}
                                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                                error={!!errors['address.state']}
                                            />
                                            <InputError message={errors['address.state']} />
                                        </div>

                                        <div>
                                            <Label htmlFor="address.postal_code">Postal Code</Label>
                                            <InputField
                                                id="address.postal_code"
                                                name="address[postal_code]"
                                                value={formData.address.postal_code}
                                                onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                                                error={!!errors['address.postal_code']}
                                            />
                                            <InputError message={errors['address.postal_code']} />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Preferences">
                                <div className="space-y-6 p-6">
                                    <div>
                                        <Label htmlFor="preferred_shop_id">Preferred Shop</Label>
                                        <Select
                                            options={[
                                                { value: '', label: 'No Preference' },
                                                ...shops.map((shop) => ({
                                                    value: shop.id.toString(),
                                                    label: shop.name,
                                                })),
                                            ]}
                                            defaultValue={formData.preferred_shop_id?.toString() || ''}
                                            onChange={(value) => handleInputChange('preferred_shop_id', value ? parseInt(value) : null)}
                                        />
                                        <input
                                            type="hidden"
                                            name="preferred_shop_id"
                                            value={formData.preferred_shop_id || ''}
                                        />
                                        <InputError message={errors.preferred_shop_id} />
                                    </div>

                                    <div className="space-y-4">
                                        {showDeactivateConfirm ? (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-red-900 dark:text-red-100">
                                                            Deactivate customer account?
                                                        </h4>
                                                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                                            This customer will not be able to log in or make purchases until reactivated.
                                                        </p>
                                                        <div className="mt-4 flex gap-3">
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                type="button"
                                                                onClick={confirmDeactivate}
                                                            >
                                                                Deactivate
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                type="button"
                                                                onClick={() => setShowDeactivateConfirm(false)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    name="is_active"
                                                    value="1"
                                                    checked={formData.is_active}
                                                    onChange={(e) => handleStatusChange(e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                                />
                                                <Label htmlFor="is_active" className="mb-0">
                                                    Account is active
                                                </Label>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="marketing_opt_in"
                                                name="marketing_opt_in"
                                                value="1"
                                                checked={formData.marketing_opt_in}
                                                onChange={(e) => handleInputChange('marketing_opt_in', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            <Label htmlFor="marketing_opt_in" className="mb-0">
                                                Opted in to marketing communications
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Credit Settings">
                                <div className="space-y-6 p-6">
                                    <div>
                                        <Label htmlFor="credit_limit">Credit Limit</Label>
                                        <InputField
                                            id="credit_limit"
                                            name="credit_limit"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.credit_limit}
                                            onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                                            error={!!errors.credit_limit}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Set to 0 or leave empty to remove credit limit.
                                        </p>
                                        <InputError message={errors.credit_limit} />
                                    </div>

                                    {customer.account_balance && parseFloat(customer.account_balance) > 0 && (
                                        <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                                <strong>Current Balance:</strong> ₦{parseFloat(customer.account_balance).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <div className="flex items-center justify-between">
                                <Button
                                    variant="destructive"
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
                                            router.delete(CustomerController.destroy.url({ customer: customer.id }));
                                        }
                                    }}
                                >
                                    Delete Customer
                                </Button>

                                <div className="flex items-center gap-4">
                                    <Link href={CustomerController.show.url({ customer: customer.id })}>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
}

Edit.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
