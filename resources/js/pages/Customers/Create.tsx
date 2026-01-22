import CustomerController from '@/actions/App/Http/Controllers/CustomerController';
import InputField from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import AppLayout from '@/layouts/AppLayout';
import type {
    CustomerCreatePageProps,
    GeneratedCustomerData,
} from '@/types/customer';
import { DEFAULT_CREATE_CUSTOMER_FORM_DATA } from '@/types/customer';
import { Form, Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, Check, ChevronLeft, Copy, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

export default function Create({ shops }: CustomerCreatePageProps) {
    const form = useForm(DEFAULT_CREATE_CUSTOMER_FORM_DATA);
    const [generatedCredentials, setGeneratedCredentials] = useState<{
        email: string;
        password: string;
    } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleGenerateCustomer = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch(
                CustomerController.generateData.url(),
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to generate customer data');
            }

            const data: GeneratedCustomerData = await response.json();

            form.setData({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                password: data.password,
                address: data.address,
                preferred_shop_id: null,
                is_active: data.is_active,
                marketing_opt_in: data.marketing_opt_in,
                credit_limit: '',
            });

            setGeneratedCredentials({
                email: data.email,
                password: data.password,
            });
        } catch (error) {
            console.error('Failed to generate customer data:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = (field: string, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <>
            <Head title="Create Customer" />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={CustomerController.index.url()}
                        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Customers
                    </Link>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Create Customer
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Add a new customer account for your business
                    </p>
                </div>

                <Card className="border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-900/20">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                                <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Quick Customer Generation
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Quickly create a customer with
                                    auto-generated details. Perfect for POS
                                    workflows where you need to assign a
                                    customer fast.
                                </p>
                                <Button
                                    className="mt-4 gap-2"
                                    onClick={handleGenerateCustomer}
                                    disabled={isGenerating}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {isGenerating
                                        ? 'Generating...'
                                        : 'Generate Customer'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {generatedCredentials && (
                    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                        <div className="p-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                                        Customer Credentials Generated
                                    </h3>
                                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                        Please note these credentials for the
                                        customer. They can change their password
                                        later.
                                    </p>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-800">
                                            <div>
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Email
                                                </span>
                                                <p className="font-mono text-sm text-gray-900 dark:text-white">
                                                    {generatedCredentials.email}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleCopy(
                                                        'email',
                                                        generatedCredentials.email,
                                                    )
                                                }
                                            >
                                                {copiedField === 'email' ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-800">
                                            <div>
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Password
                                                </span>
                                                <p className="font-mono text-sm text-gray-900 dark:text-white">
                                                    {
                                                        generatedCredentials.password
                                                    }
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleCopy(
                                                        'password',
                                                        generatedCredentials.password,
                                                    )
                                                }
                                            >
                                                {copiedField === 'password' ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(CustomerController.store.url());
                    }}
                >
                    <div className="space-y-6">
                        <Card title="Personal Information">
                            <div className="space-y-6 p-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="first_name">
                                            First Name
                                        </Label>
                                        <InputField
                                            id="first_name"
                                            name="first_name"
                                            value={form.data.first_name}
                                            onChange={(e) =>
                                                form.setData(
                                                    'first_name',
                                                    e.target.value,
                                                )
                                            }
                                            error={!!form.errors.first_name}
                                        />
                                        <InputError
                                            message={form.errors.first_name}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="last_name">
                                            Last Name
                                        </Label>
                                        <InputField
                                            id="last_name"
                                            name="last_name"
                                            value={form.data.last_name}
                                            onChange={(e) =>
                                                form.setData(
                                                    'last_name',
                                                    e.target.value,
                                                )
                                            }
                                            error={!!form.errors.last_name}
                                        />
                                        <InputError
                                            message={form.errors.last_name}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="email">
                                            Email Address
                                        </Label>
                                        <InputField
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={form.data.email}
                                            onChange={(e) =>
                                                form.setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            error={!!form.errors.email}
                                        />
                                        <InputError
                                            message={form.errors.email}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <InputField
                                            id="phone"
                                            name="phone"
                                            value={form.data.phone}
                                            onChange={(e) =>
                                                form.setData(
                                                    'phone',
                                                    e.target.value,
                                                )
                                            }
                                            error={!!form.errors.phone}
                                        />
                                        <InputError
                                            message={form.errors.phone}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="password">
                                        Password
                                    </Label>
                                    <InputField
                                        id="password"
                                        name="password"
                                        type="text"
                                        value={form.data.password}
                                        onChange={(e) =>
                                            form.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        error={!!form.errors.password}
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        The customer can change this
                                        password later via storefront
                                    </p>
                                    <InputError message={form.errors.password} />
                                </div>
                            </div>
                        </Card>

                        <Card title="Address">
                            <div className="space-y-6 p-6">
                                <div>
                                    <Label htmlFor="address.street">
                                        Street Address
                                    </Label>
                                    <InputField
                                        id="address.street"
                                        name="address[street]"
                                        value={form.data.address.street}
                                        onChange={(e) =>
                                            form.setData('address', {
                                                ...form.data.address,
                                                street: e.target.value,
                                            })
                                        }
                                        error={!!form.errors['address.street']}
                                    />
                                    <InputError
                                        message={form.errors['address.street']}
                                    />
                                </div>

                                <div className="grid gap-6 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="address.city">
                                            City
                                        </Label>
                                        <InputField
                                            id="address.city"
                                            name="address[city]"
                                            value={form.data.address.city}
                                            onChange={(e) =>
                                                form.setData('address', {
                                                    ...form.data.address,
                                                    city: e.target.value,
                                                })
                                            }
                                            error={!!form.errors['address.city']}
                                        />
                                        <InputError
                                            message={form.errors['address.city']}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="address.state">
                                            State
                                        </Label>
                                        <InputField
                                            id="address.state"
                                            name="address[state]"
                                            value={form.data.address.state}
                                            onChange={(e) =>
                                                form.setData('address', {
                                                    ...form.data.address,
                                                    state: e.target.value,
                                                })
                                            }
                                            error={
                                                !!form.errors['address.state']
                                            }
                                        />
                                        <InputError
                                            message={
                                                form.errors['address.state']
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="address.postal_code">
                                            Postal Code
                                        </Label>
                                        <InputField
                                            id="address.postal_code"
                                            name="address[postal_code]"
                                            value={
                                                form.data.address.postal_code
                                            }
                                            onChange={(e) =>
                                                form.setData('address', {
                                                    ...form.data.address,
                                                    postal_code: e.target.value,
                                                })
                                            }
                                            error={
                                                !!form.errors[
                                                    'address.postal_code'
                                                ]
                                            }
                                        />
                                        <InputError
                                            message={
                                                form.errors[
                                                    'address.postal_code'
                                                ]
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Preferences">
                            <div className="space-y-6 p-6">
                                <div>
                                    <Label htmlFor="preferred_shop_id">
                                        Preferred Shop
                                    </Label>
                                    <Select
                                        options={[
                                            {
                                                value: '',
                                                label: 'No Preference',
                                            },
                                            ...shops.map((shop) => ({
                                                value: shop.id.toString(),
                                                label: shop.name,
                                            })),
                                        ]}
                                        value={
                                            form.data.preferred_shop_id?.toString() ||
                                            ''
                                        }
                                        onChange={(value) =>
                                            form.setData(
                                                'preferred_shop_id',
                                                value
                                                    ? parseInt(value)
                                                    : null,
                                            )
                                        }
                                    />
                                    <input
                                        type="hidden"
                                        name="preferred_shop_id"
                                        value={
                                            form.data.preferred_shop_id || ''
                                        }
                                    />
                                    <InputError
                                        message={form.errors.preferred_shop_id}
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        name="is_active"
                                        value="1"
                                        checked={form.data.is_active}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="mb-0"
                                    >
                                        Account is active
                                    </Label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="marketing_opt_in"
                                        name="marketing_opt_in"
                                        value="1"
                                        checked={form.data.marketing_opt_in}
                                        onChange={(e) =>
                                            form.setData(
                                                'marketing_opt_in',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <Label
                                        htmlFor="marketing_opt_in"
                                        className="mb-0"
                                    >
                                        Opted in to marketing communications
                                    </Label>
                                </div>
                            </div>
                        </Card>

                        <Card title="Credit Settings">
                            <div className="space-y-6 p-6">
                                <div>
                                    <Label htmlFor="credit_limit">
                                        Credit Limit (Optional)
                                    </Label>
                                    <InputField
                                        id="credit_limit"
                                        name="credit_limit"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.data.credit_limit}
                                        onChange={(e) =>
                                            form.setData(
                                                'credit_limit',
                                                e.target.value,
                                            )
                                        }
                                        error={!!form.errors.credit_limit}
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Leave empty for no credit limit. Set
                                        a value to allow purchases on
                                        credit.
                                    </p>
                                    <InputError
                                        message={form.errors.credit_limit}
                                    />
                                </div>
                            </div>
                        </Card>

                        <div className="flex items-center justify-end gap-4">
                            <Link href={CustomerController.index.url()}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing
                                    ? 'Creating...'
                                    : 'Create Customer'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
