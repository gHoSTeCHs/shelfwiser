import ShopController from '@/actions/App/Http/Controllers/ShopController.ts';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import DynamicSchemaField from '@/components/shops/DynamicSchemaField';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { SchemaProperty } from '@/types';
import { InventoryModelOption, Shop, ShopType } from '@/types/shop';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, MapPin, Package, Save } from 'lucide-react';
import { useState } from 'react';

interface Props {
    shop: Shop;
    shopTypes: ShopType[];
    inventoryModels: InventoryModelOption[];
}

export default function Edit({ shop, shopTypes, inventoryModels }: Props) {
    const [shopConfig, setShopConfig] = useState<Record<string, unknown>>(
        shop.config || {},
    );
    const [selectedInventoryModel, setSelectedInventoryModel] =
        useState<string>(shop.inventory_model || 'simple_retail');
    const [isActive, setIsActive] = useState<boolean>(shop.is_active ?? true);

    const selectedType = shopTypes.find((type) => type.slug === shop.type.slug);

    const selectedInventoryModelData = inventoryModels.find(
        (model) => model.value === selectedInventoryModel,
    );

    const handleConfigChange = (fieldName: string, value: unknown) => {
        setShopConfig((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    return (
        <>
            <Head title={`Edit ${shop.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={`/shops/${shop.id}`}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Shop
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Edit Shop
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Update shop details and configuration
                        </p>
                    </div>
                </div>

                <Form
                    action={ShopController.update.url({ shop: shop.id })}
                    method="put"
                    className="space-y-6"
                    transform={(data) => {
                        const transformedConfig: Record<string, any> = {};
                        const configProperties =
                            selectedType?.config_schema?.properties;

                        if (configProperties && data.config) {
                            Object.entries(data.config).forEach(
                                ([key, value]) => {
                                    const schema = configProperties[key] as
                                        | SchemaProperty
                                        | undefined;
                                    if (schema) {
                                        if (schema.type === 'integer') {
                                            transformedConfig[key] = parseInt(
                                                value as string,
                                            );
                                        } else if (schema.type === 'number') {
                                            transformedConfig[key] = parseFloat(
                                                value as string,
                                            );
                                        } else if (schema.type === 'boolean') {
                                            transformedConfig[key] =
                                                value === 'true';
                                        } else {
                                            transformedConfig[key] = value;
                                        }
                                    } else {
                                        transformedConfig[key] = value;
                                    }
                                },
                            );
                        }

                        return {
                            ...data,
                            config: transformedConfig,
                        };
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            <Card>
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                        <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Basic Information
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Update your shop details
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
                                            defaultValue={shop.name}
                                            placeholder="e.g., Downtown Store, Main Branch"
                                            error={!!errors.name}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="shop_type">
                                            Shop Type
                                        </Label>
                                        <Input
                                            type="text"
                                            id="shop_type"
                                            value={shop.type.label}
                                            disabled
                                            className="bg-gray-50 dark:bg-gray-900"
                                        />
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Shop type cannot be changed after
                                            creation
                                        </p>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="is_active"
                                                checked={isActive}
                                                onChange={setIsActive}
                                                className="h-5 w-5"
                                            />
                                            <Label
                                                htmlFor="is_active"
                                                className="mb-0 font-normal text-gray-700 dark:text-gray-400"
                                            >
                                                Shop is active and ready to
                                                accept orders
                                            </Label>
                                        </div>
                                        <input
                                            type="hidden"
                                            name="is_active"
                                            value={isActive ? '1' : '0'}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                        <Package className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Inventory Management Model
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Update how you manage inventory
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <Label htmlFor="inventory_model">
                                            Inventory Model
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={inventoryModels.map(
                                                (model) => ({
                                                    value: model.value,
                                                    label: model.label,
                                                }),
                                            )}
                                            onChange={(value) =>
                                                setSelectedInventoryModel(value)
                                            }
                                            defaultValue={shop.inventory_model}
                                        />
                                        <input
                                            type="hidden"
                                            name="inventory_model"
                                            value={selectedInventoryModel}
                                        />
                                        <InputError
                                            message={errors.inventory_model}
                                        />
                                    </div>

                                    {selectedInventoryModelData && (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                                            <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                                                {
                                                    selectedInventoryModelData.label
                                                }
                                            </h3>
                                            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                                {
                                                    selectedInventoryModelData.description
                                                }
                                            </p>
                                            <div className="mb-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                <span>
                                                    Complexity:{' '}
                                                    <span className="font-medium text-gray-700 capitalize dark:text-gray-300">
                                                        {
                                                            selectedInventoryModelData.complexity
                                                        }
                                                    </span>
                                                </span>
                                                <span className="text-gray-300 dark:text-gray-600">
                                                    •
                                                </span>
                                                <span>
                                                    {
                                                        selectedInventoryModelData.suitable_for
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    Key Features:
                                                </p>
                                                <ul className="space-y-1">
                                                    {selectedInventoryModelData.features.map(
                                                        (feature, index) => (
                                                            <li
                                                                key={index}
                                                                className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                                                            >
                                                                <span className="mt-0.5 text-brand-500">
                                                                    ✓
                                                                </span>
                                                                <span>
                                                                    {feature}
                                                                </span>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                        <MapPin className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Contact & Location
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Shop address and contact details
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <Label htmlFor="address">Address</Label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            defaultValue={shop.address || ''}
                                            placeholder="Street address, building name, apartment, suite, etc."
                                            rows={3}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
                                        />
                                        <InputError message={errors.address} />
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="city">
                                                City
                                                <span className="text-error-500">
                                                    {' '}
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="city"
                                                name="city"
                                                defaultValue={shop.city || ''}
                                                placeholder="Enter city"
                                                error={!!errors.city}
                                                required
                                            />
                                            <InputError message={errors.city} />
                                        </div>

                                        <div>
                                            <Label htmlFor="state">
                                                State/Province
                                                <span className="text-error-500">
                                                    {' '}
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="state"
                                                name="state"
                                                defaultValue={shop.state || ''}
                                                placeholder="Enter state"
                                                error={!!errors.state}
                                                required
                                            />
                                            <InputError
                                                message={errors.state}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="country">
                                            Country
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="country"
                                            name="country"
                                            defaultValue={shop.country || ''}
                                            placeholder="Enter country"
                                            error={!!errors.country}
                                            required
                                        />
                                        <InputError message={errors.country} />
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="phone">
                                                Phone Number
                                            </Label>
                                            <Input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                defaultValue={shop.phone || ''}
                                                placeholder="+234 XXX XXX XXXX"
                                                error={!!errors.phone}
                                            />
                                            <InputError
                                                message={errors.phone}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="email">
                                                Email Address
                                            </Label>
                                            <Input
                                                type="email"
                                                id="email"
                                                name="email"
                                                defaultValue={shop.email || ''}
                                                placeholder="shop@example.com"
                                                error={!!errors.email}
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {selectedType?.config_schema?.properties && (
                                <Card>
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
                                        ).map(([fieldName, rawSchema]) => {
                                            const schema = rawSchema as SchemaProperty;
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
                                                            shopConfig[
                                                                fieldName
                                                            ] as import('@/types').SchemaPropertyValue
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
                                                        (shopConfig[fieldName] as unknown[]).map(
                                                            (
                                                                item,
                                                                index,
                                                            ) => (
                                                                <input
                                                                    key={index}
                                                                    type="hidden"
                                                                    name={`config[${fieldName}][]`}
                                                                    value={String(item)}
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
                                                            value={String(
                                                                shopConfig[
                                                                    fieldName
                                                                ] ?? ''
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
                                <Link href={`/shops/${shop.id}`}>
                                    <Button
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Save className="mr-2 h-4 w-4 animate-pulse" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Edit.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
