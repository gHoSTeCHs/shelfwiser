import FundRequestController from '@/actions/App/Http/Controllers/FundRequestController.ts';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, Form } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';

interface Shop {
    id: number;
    name: string;
}

interface RequestType {
    value: string;
    label: string;
    description: string;
    icon: string;
}

interface Props {
    shops: Shop[];
    requestTypes: RequestType[];
}

const FundRequestsCreate = ({ shops, requestTypes }: Props) => {
    const [shopId, setShopId] = useState(shops.length > 0 ? shops[0].id : 0);
    const [requestType, setRequestType] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    return (
        <div className="h-screen">
            <Head title="New Fund Request" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={FundRequestController.index.url()}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            New Fund Request
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Request operational funds for your shop
                        </p>
                    </div>
                </div>

                <Form
                    action={FundRequestController.store.url()}
                    method="post"
                >
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                    Request Details
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="shop_id">
                                            Shop <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="shop_id"
                                            name="shop_id"
                                            value={shopId}
                                            onChange={(e) => setShopId(parseInt(e.target.value))}
                                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            required
                                        >
                                            {shops.map((shop) => (
                                                <option key={shop.id} value={shop.id}>
                                                    {shop.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.shop_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="request_type">
                                            Request Type <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {requestTypes.map((type) => (
                                                <label
                                                    key={type.value}
                                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                                                        requestType === type.value
                                                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="request_type"
                                                        value={type.value}
                                                        checked={requestType === type.value}
                                                        onChange={(e) => setRequestType(e.target.value)}
                                                        className="mt-1"
                                                        required
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {type.label}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                            {type.description}
                                                        </p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors.request_type} />
                                    </div>

                                    <div>
                                        <Label htmlFor="amount">
                                            Amount <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative mt-2">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-gray-500 dark:text-gray-400">$</span>
                                            </div>
                                            <Input
                                                type="number"
                                                id="amount"
                                                name="amount"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0.01"
                                                error={!!errors.amount}
                                                required
                                                className="pl-7"
                                            />
                                        </div>
                                        <InputError message={errors.amount} />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">
                                            Description <span className="text-red-500">*</span>
                                        </Label>
                                        <TextArea
                                            id="description"
                                            name="description"
                                            value={description}
                                            onChange={(value) => setDescription(value)}
                                            rows={4}
                                            error={!!errors.description}
                                            hint="Provide detailed information about what the funds will be used for"
                                            required
                                        />
                                        <InputError message={errors.description} />
                                    </div>
                                </div>
                            </Card>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing} className="flex-1">
                                    Submit Request
                                </Button>
                                <Link href={FundRequestController.index.url()}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </div>
    );
};

FundRequestsCreate.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default FundRequestsCreate;
