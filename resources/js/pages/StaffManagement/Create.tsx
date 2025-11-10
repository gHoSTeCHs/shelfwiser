/* eslint-disable @typescript-eslint/no-explicit-any */

import StaffManagementController from '@/actions/App/Http/Controllers/Web/StaffManagementController.ts';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, Save, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface Role {
    value: string;
    label: string;
    description: string;
    level: number;
    can_access_multiple_shops: boolean;
}

interface Shop {
    id: number;
    name: string;
    slug: string;
    city: string;
    state: string;
}

interface Props {
    roles: Role[];
    shops: Shop[];
}

export default function Create({ roles, shops }: Props) {
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedShops, setSelectedShops] = useState<number[]>([]);
    const [sendInvitation, setSendInvitation] = useState<boolean>(false);

    const currentRole = roles.find((role) => role.value === selectedRole);

    const handleShopToggle = (shopId: number) => {
        setSelectedShops((prev) =>
            prev.includes(shopId)
                ? prev.filter((id) => id !== shopId)
                : [...prev, shopId],
        );
    };

    return (
        <AppLayout>
            <Head title="Add Staff Member" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={'/staff'}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Staff
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Add Staff Member
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Create a new staff account and assign roles &amp;
                            permissions
                        </p>
                    </div>
                </div>

                <Form
                    action={StaffManagementController.store.url()}
                    method="post"
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <Card>
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                        <UserPlus className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Personal Information
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Basic details about the staff member
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="first_name">
                                                First Name
                                                <span className="text-error-500">
                                                    {' '}
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="first_name"
                                                name="first_name"
                                                placeholder="John"
                                                error={!!errors.first_name}
                                                required
                                            />
                                            <InputError
                                                message={errors.first_name}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="last_name">
                                                Last Name
                                                <span className="text-error-500">
                                                    {' '}
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="last_name"
                                                name="last_name"
                                                placeholder="Doe"
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
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="john.doe@example.com"
                                            error={!!errors.email}
                                            required
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <Label htmlFor="password">
                                            Password
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="password"
                                            id="password"
                                            name="password"
                                            placeholder="••••••••"
                                            error={!!errors.password}
                                            required
                                        />
                                        <InputError message={errors.password} />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Minimum 8 characters
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Role & Permissions
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Assign a role to define access levels
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <Label htmlFor="role">
                                            Role
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Select a role',
                                                },
                                                ...roles.map((role) => ({
                                                    value: role.value,
                                                    label: role.label,
                                                })),
                                            ]}
                                            placeholder="Select role"
                                            onChange={(value) =>
                                                setSelectedRole(value)
                                            }
                                            defaultValue=""
                                        />
                                        <input
                                            type="hidden"
                                            name="role"
                                            value={selectedRole}
                                        />
                                        <InputError message={errors.role} />
                                        {currentRole && (
                                            <div className="mt-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {currentRole.label}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    {currentRole.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {currentRole && shops.length > 0 && (
                                <Card>
                                    <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                            <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Shop Assignment
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {currentRole.can_access_multiple_shops
                                                    ? 'This role can access multiple shops'
                                                    : 'Assign to a specific shop location'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {shops.map((shop) => (
                                            <div
                                                key={shop.id}
                                                className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                            >
                                                <Checkbox
                                                    id={`shop-${shop.id}`}
                                                    checked={selectedShops.includes(
                                                        shop.id,
                                                    )}
                                                    onChange={() =>
                                                        handleShopToggle(shop.id)
                                                    }
                                                    className="mt-0.5 h-5 w-5"
                                                />
                                                <Label
                                                    htmlFor={`shop-${shop.id}`}
                                                    className="mb-0 flex-1 cursor-pointer"
                                                >
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {shop.name}
                                                    </span>
                                                    <span className="block text-sm text-gray-500 dark:text-gray-400">
                                                        {shop.city}, {shop.state}
                                                    </span>
                                                </Label>
                                            </div>
                                        ))}
                                        {selectedShops.map((shopId) => (
                                            <input
                                                key={shopId}
                                                type="hidden"
                                                name="shop_ids[]"
                                                value={shopId}
                                            />
                                        ))}
                                        <InputError
                                            message={errors['shop_ids.0']}
                                        />
                                    </div>

                                    {!currentRole.can_access_multiple_shops &&
                                        selectedShops.length > 1 && (
                                            <div className="mt-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    Note: {currentRole.label}{' '}
                                                    typically manages one shop.
                                                    Multiple shops selected.
                                                </p>
                                            </div>
                                        )}
                                </Card>
                            )}

                            <Card>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="send_invitation"
                                            checked={sendInvitation}
                                            onChange={setSendInvitation}
                                            className="h-5 w-5"
                                        />
                                        <Label
                                            htmlFor="send_invitation"
                                            className="mb-0 font-normal text-gray-700 dark:text-gray-400"
                                        >
                                            Send invitation email to staff member
                                        </Label>
                                    </div>
                                    <input
                                        type="hidden"
                                        name="send_invitation"
                                        value={sendInvitation ? '1' : '0'}
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        An email with login credentials and
                                        getting started information will be sent
                                        to the staff member.
                                    </p>
                                </div>
                            </Card>

                            <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
                                <Link href={'/staff'}>
                                    <Button
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing || !selectedRole}
                                >
                                    {processing ? (
                                        <>
                                            <Save className="mr-2 h-4 w-4 animate-pulse" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Create Staff Member
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
