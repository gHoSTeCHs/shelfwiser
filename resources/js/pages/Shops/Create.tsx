/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { ShopType } from '@/types/shop';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, MapPin, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SchemaProperty {
    type: 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
    title?: string;
    default?: any;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    items?: {
        type?: string;
        enum?: any[];
    };
}

interface Props {
    shopTypes: ShopType[];
}

export default function Create({ shopTypes }: Props) {
    const [selectedTypeSlug, setSelectedTypeSlug] = useState<string>('');
    const [shopConfig, setShopConfig] = useState<Record<string, any>>({});
    const [shopName, setShopName] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);

    const [addressLine1, setAddressLine1] = useState<string>('');
    const [addressLine2, setAddressLine2] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [state, setState] = useState<string>('');
    const [postalCode, setPostalCode] = useState<string>('');
    const [country, setCountry] = useState<string>('Nigeria');
    const [phone, setPhone] = useState<string>('');
    const [email, setEmail] = useState<string>('');

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
                            href={'/shops'}
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

                <Form
                    action={ShopController.store.url()}
                    method="post"
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
                                        <Label htmlFor="address_line1">
                                            Address Line 1
                                        </Label>
                                        <Input
                                            type="text"
                                            id="address_line1"
                                            name="address_line1"
                                            value={addressLine1}
                                            onChange={(e) =>
                                                setAddressLine1(e.target.value)
                                            }
                                            placeholder="Street address, building name"
                                            error={!!errors.address_line1}
                                        />
                                        <InputError
                                            message={errors.address_line1}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="address_line2">
                                            Address Line 2
                                        </Label>
                                        <Input
                                            type="text"
                                            id="address_line2"
                                            name="address_line2"
                                            value={addressLine2}
                                            onChange={(e) =>
                                                setAddressLine2(e.target.value)
                                            }
                                            placeholder="Apartment, suite, unit, floor (optional)"
                                            error={!!errors.address_line2}
                                        />
                                        <InputError
                                            message={errors.address_line2}
                                        />
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                type="text"
                                                id="city"
                                                name="city"
                                                value={city}
                                                onChange={(e) =>
                                                    setCity(e.target.value)
                                                }
                                                placeholder="Enter city"
                                                error={!!errors.city}
                                            />
                                            <InputError message={errors.city} />
                                        </div>

                                        <div>
                                            <Label htmlFor="state">
                                                State/Province
                                            </Label>
                                            <Input
                                                type="text"
                                                id="state"
                                                name="state"
                                                value={state}
                                                onChange={(e) =>
                                                    setState(e.target.value)
                                                }
                                                placeholder="Enter state"
                                                error={!!errors.state}
                                            />
                                            <InputError
                                                message={errors.state}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="postal_code">
                                                Postal Code
                                            </Label>
                                            <Input
                                                type="text"
                                                id="postal_code"
                                                name="postal_code"
                                                value={postalCode}
                                                onChange={(e) =>
                                                    setPostalCode(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter postal code"
                                                error={!!errors.postal_code}
                                            />
                                            <InputError
                                                message={errors.postal_code}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="country">
                                                Country
                                            </Label>
                                            <Input
                                                type="text"
                                                id="country"
                                                name="country"
                                                value={country}
                                                onChange={(e) =>
                                                    setCountry(e.target.value)
                                                }
                                                placeholder="Enter country"
                                                error={!!errors.country}
                                            />
                                            <InputError
                                                message={errors.country}
                                            />
                                        </div>
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
                                                value={phone}
                                                onChange={(e) =>
                                                    setPhone(e.target.value)
                                                }
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
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
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
                                                        schema={
                                                            schema as SchemaProperty
                                                        }
                                                        value={
                                                            shopConfig[
                                                                fieldName
                                                            ]
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
                                <Card className="p-6">
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
                                <Link href={'/shops'}>
                                    <Button
                                        variant="outline"
                                        disabled={processing}
                                    >
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
