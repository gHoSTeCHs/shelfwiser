import AppLayout from '@/layouts/AppLayout';
import AdminTenantController from '@/actions/App/Http/Controllers/Admin/AdminTenantController';
import { Head, Link, Form } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Checkbox from '@/components/form/input/Checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

interface SubscriptionPlan {
    label: string;
    max_shops: number;
    max_users: number;
    max_products: number;
}

interface Props {
    subscriptionPlans: Record<string, SubscriptionPlan>;
}

export default function Create({ subscriptionPlans }: Props) {
    const [selectedPlan, setSelectedPlan] = useState('trial');
    const [maxShops, setMaxShops] = useState(subscriptionPlans.trial.max_shops);
    const [maxUsers, setMaxUsers] = useState(subscriptionPlans.trial.max_users);
    const [maxProducts, setMaxProducts] = useState(subscriptionPlans.trial.max_products);
    const [isActive, setIsActive] = useState(true);

    const handlePlanChange = (plan: string) => {
        setSelectedPlan(plan);
        if (subscriptionPlans[plan]) {
            setMaxShops(subscriptionPlans[plan].max_shops);
            setMaxUsers(subscriptionPlans[plan].max_users);
            setMaxProducts(subscriptionPlans[plan].max_products);
        }
    };

    return (
        <AppLayout>
            <Head title="Create Tenant" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/tenants">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create Tenant
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Set up a new tenant with subscription details
                        </p>
                    </div>
                </div>

                <Form
                    action={AdminTenantController.store.url()}
                    method="post"
                >
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Basic Information
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name">
                                            Tenant Name <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="Enter tenant name"
                                            error={!!errors.name}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="slug">
                                            Slug <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="slug"
                                            name="slug"
                                            type="text"
                                            placeholder="tenant-slug"
                                            error={!!errors.slug}
                                            required
                                        />
                                        <InputError message={errors.slug} />
                                    </div>

                                    <div>
                                        <Label htmlFor="owner_email">
                                            Owner Email <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="owner_email"
                                            name="owner_email"
                                            type="email"
                                            placeholder="owner@example.com"
                                            error={!!errors.owner_email}
                                            required
                                        />
                                        <InputError message={errors.owner_email} />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+1 (555) 123-4567"
                                            error={!!errors.phone}
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <Label htmlFor="business_type">Business Type</Label>
                                        <Input
                                            id="business_type"
                                            name="business_type"
                                            type="text"
                                            placeholder="e.g., Retail, Restaurant, etc."
                                            error={!!errors.business_type}
                                        />
                                        <InputError message={errors.business_type} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Subscription
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <Label>
                                            Subscription Plan <span className="text-error-500">*</span>
                                        </Label>
                                        <Select
                                            options={Object.entries(subscriptionPlans).map(([key, plan]) => ({
                                                value: key,
                                                label: plan.label,
                                            }))}
                                            defaultValue={selectedPlan}
                                            onChange={handlePlanChange}
                                        />
                                        <input type="hidden" name="subscription_plan" value={selectedPlan} />
                                        <InputError message={errors.subscription_plan} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Limits
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="max_shops">
                                            Max Shops <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="max_shops"
                                            name="max_shops"
                                            type="number"
                                            value={maxShops}
                                            onChange={(e) => setMaxShops(parseInt(e.target.value) || 1)}
                                            error={!!errors.max_shops}
                                            required
                                        />
                                        <InputError message={errors.max_shops} />
                                    </div>

                                    <div>
                                        <Label htmlFor="max_users">
                                            Max Users <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="max_users"
                                            name="max_users"
                                            type="number"
                                            value={maxUsers}
                                            onChange={(e) => setMaxUsers(parseInt(e.target.value) || 1)}
                                            error={!!errors.max_users}
                                            required
                                        />
                                        <InputError message={errors.max_users} />
                                    </div>

                                    <div>
                                        <Label htmlFor="max_products">
                                            Max Products <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            id="max_products"
                                            name="max_products"
                                            type="number"
                                            value={maxProducts}
                                            onChange={(e) => setMaxProducts(parseInt(e.target.value) || 1)}
                                            error={!!errors.max_products}
                                            required
                                        />
                                        <InputError message={errors.max_products} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Settings
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                    <input type="hidden" name="is_active" value={isActive ? '1' : '0'} />
                                    <Label htmlFor="is_active" className="mb-0 cursor-pointer">
                                        Active
                                    </Label>
                                </div>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Inactive tenants cannot access the platform
                                </p>
                            </Card>

                            <div className="flex justify-end gap-3">
                                <Link href="/admin/tenants">
                                    <Button variant="outline">Cancel</Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    loading={processing}
                                    startIcon={<Save className="h-4 w-4" />}
                                >
                                    Create Tenant
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
