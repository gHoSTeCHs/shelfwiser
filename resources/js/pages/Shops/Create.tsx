import React, { useState, useEffect } from 'react';
import { Head, Link, Form } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import ShopController from '@/actions/App/Http/Controllers/ShopController';
import { ShopType } from '@/types/shop';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import InputError from '@/components/form/InputError';
import Button from '@/components/ui/button/Button';
import DynamicSchemaField from '@/components/shops/DynamicSchemaField';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Props {
    shopTypes: ShopType[];
}

export default function Create({ shopTypes }: Props) {
    const [selectedTypeSlug, setSelectedTypeSlug] = useState<string>('');
    const [shopConfig, setShopConfig] = useState<Record<string, any>>({});
    const [shopName, setShopName] = useState<string>('');

    const selectedType = shopTypes.find(
        (type) => type.slug === selectedTypeSlug,
    );

    useEffect(() => {
        if (selectedType?.config_schema?.properties) {
            const defaults: Record<string, any> = {};
            Object.entries(selectedType.config_schema.properties).forEach(
                ([key, prop]) => {
                    if (prop.default !== undefined) {
                        defaults[key] = prop.default;
                    }
                },
            );
            setShopConfig(defaults);
        } else {
            setShopConfig({});
        }
    }, [selectedTypeSlug]);

    const handleConfigChange = (fieldName: string, value: any) => {
        setShopConfig((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    return (
        <AppLayout>
            <Head title="Create Shop" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/shops"
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Shops
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create New Shop
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Set up a new shop location for your business
                        </p>
                    </div>
                </div>

                <Form {...ShopController.store.form()} className="space-y-6">
                    {({ errors, processing }) => (
                        <>
                            <Card className="p-6">
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                        <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Basic Information
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Configure your shop details
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <Label htmlFor="name">
                                            Shop Name
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={shopName}
                                            onChange={(e) =>
                                                setShopName(e.target.value)
                                            }
                                            placeholder="e.g., Downtown Store, Main Branch"
                                            error={!!errors.name}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="shop_type_slug">
                                            Shop Type
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Select a shop type',
                                                },
                                                ...shopTypes.map((type) => ({
                                                    value: type.slug,
                                                    label: type.label,
                                                })),
                                            ]}
                                            placeholder="Select shop type"
                                            onChange={(value) =>
                                                setSelectedTypeSlug(value)
                                            }
                                            defaultValue=""
                                        />
                                        <input
                                            type="hidden"
                                            name="shop_type_slug"
                                            value={selectedTypeSlug}
                                        />
                                        <InputError
                                            message={errors.shop_type_slug}
                                        />
                                        {selectedType?.description && (
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                {selectedType.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {selectedType?.config_schema?.properties && (
                                <Card className="p-6">
                                    <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-700">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {selectedType.label} Configuration
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Customize settings specific to your{' '}
                                            {selectedType.label.toLowerCase()}{' '}
                                            business
                                        </p>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        {Object.entries(
                                            selectedType.config_schema
                                                .properties,
                                        ).map(([fieldName, schema]) => {
                                            const isRequired =
                                                selectedType.config_schema?.required?.includes(
                                                    fieldName,
                                                ) ?? false;

                                            const fieldError =
                                                errors[`config.${fieldName}`];

                                            return (
                                                <div
                                                    key={fieldName}
                                                    className={
                                                        schema.type ===
                                                            'boolean' ||
                                                        (schema.type ===
                                                            'array' &&
                                                            schema.items?.enum)
                                                            ? 'sm:col-span-2'
                                                            : ''
                                                    }
                                                >
                                                    <DynamicSchemaField
                                                        fieldName={fieldName}
                                                        schema={schema}
                                                        value={
                                                            shopConfig[fieldName]
                                                        }
                                                        onChange={(value) =>
                                                            handleConfigChange(
                                                                fieldName,
                                                                value,
                                                            )
                                                        }
                                                        error={fieldError}
                                                        required={isRequired}
                                                    />
                                                    {Array.isArray(
                                                        shopConfig[fieldName],
                                                    ) ? (
                                                        shopConfig[
                                                            fieldName
                                                        ].map(
                                                            (
                                                                item: any,
                                                                index: number,
                                                            ) => (
                                                                <input
                                                                    key={index}
                                                                    type="hidden"
                                                                    name={`config[${fieldName}][]`}
                                                                    value={item}
                                                                />
                                                            ),
                                                        )
                                                    ) : typeof shopConfig[
                                                          fieldName
                                                      ] === 'object' &&
                                                      shopConfig[fieldName] !==
                                                          null ? (
                                                        Object.entries(
                                                            shopConfig[
                                                                fieldName
                                                            ],
                                                        ).map(([key, val]) => (
                                                            <input
                                                                key={key}
                                                                type="hidden"
                                                                name={`config[${fieldName}][${key}]`}
                                                                value={
                                                                    val as string
                                                                }
                                                            />
                                                        ))
                                                    ) : (
                                                        <input
                                                            type="hidden"
                                                            name={`config[${fieldName}]`}
                                                            value={
                                                                shopConfig[
                                                                    fieldName
                                                                ] ?? ''
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            {!selectedType && (
                                <Card className="p-12">
                                    <div className="text-center">
                                        <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                                            Select a Shop Type
                                        </h3>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Choose a shop type above to see
                                            configuration options
                                        </p>
                                    </div>
                                </Card>
                            )}

                            <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
                                <Link href="/shops">
                                    <Button variant="outline" disabled={processing}>
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        !shopName ||
                                        !selectedTypeSlug
                                    }
                                >
                                    {processing ? (
                                        <>
                                            <Save className="mr-2 h-4 w-4 animate-pulse" />
                                            Creating Shop...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Create Shop
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
