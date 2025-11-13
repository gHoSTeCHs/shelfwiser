/* eslint-disable @typescript-eslint/no-explicit-any */

import ProductController from '@/actions/App/Http/Controllers/ProductController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import DynamicSchemaField from '@/components/shops/DynamicSchemaField';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { SchemaProperty } from '@/types';
import { ProductCategory, ProductType, ProductVariant } from '@/types/product.ts';
import { Shop } from '@/types/shop.ts';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Box, Minus, Package, Plus, Save, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { flattenCategories } from '@/lib/utils.ts';

interface Props {
    shops: Shop[];
    productTypes: ProductType[];
    categories: ProductCategory[];
}


export default function Create({ shops, productTypes, categories }: Props) {
    const [selectedTypeSlug, setSelectedTypeSlug] = useState<string>('');
    const [shopId, setShopId] = useState<number | ''>('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [productName, setProductName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [customAttributes, setCustomAttributes] = useState<
        Record<string, any>
    >({});
    const [hasVariants, setHasVariants] = useState<boolean>(false);
    const [isActive, setIsActive] = useState<boolean>(true);

    const [simpleSku, setSimpleSku] = useState<string>('');
    const [simplePrice, setSimplePrice] = useState<string>('');
    const [simpleCostPrice, setSimpleCostPrice] = useState<string>('');
    const [simpleBarcode, setSimpleBarcode] = useState<string>('');
    const [simpleBaseUnit, setSimpleBaseUnit] = useState<string>('Unit');

    const [variants, setVariants] = useState<ProductVariant[]>([
        {
            id: crypto.randomUUID(),
            sku: '',
            name: '',
            price: '',
            cost_price: '',
            barcode: '',
            base_unit_name: 'Unit',
            attributes: {},
        },
    ]);

    const selectedType = productTypes.find(
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
            setCustomAttributes(defaults);
        } else {
            setCustomAttributes({});
        }
    }, [selectedTypeSlug]);

    const handleCustomAttributeChange = (fieldName: string, value: any) => {
        setCustomAttributes((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    const addVariant = () => {
        setVariants([
            ...variants,
            {
                id: crypto.randomUUID(),
                sku: '',
                name: '',
                price: '',
                cost_price: '',
                barcode: '',
                base_unit_name: 'Unit',
                attributes: {},
            },
        ]);
    };

    const removeVariant = (id: string) => {
        if (variants.length > 1) {
            setVariants(variants.filter((v) => v.id !== id));
        }
    };

    const updateVariant = (
        id: string,
        field: keyof ProductVariant,
        value: any,
    ) => {
        setVariants(
            variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
        );
    };


    return (
        <AppLayout>
            <Head title="Create Product" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={'/products'}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Create New Product
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Add a new product to your inventory
                        </p>
                    </div>
                </div>

                <Form
                    action={ProductController.store.url()}
                    method="post"
                    className="space-y-6"
                    transform={(data) => {
                        const transformedAttributes: Record<string, any> = {};
                        const configProperties =
                            selectedType?.config_schema?.properties;

                        if (configProperties && data.custom_attributes) {
                            Object.entries(data.custom_attributes).forEach(
                                ([key, value]) => {
                                    const schema = configProperties[key] as
                                        | SchemaProperty
                                        | undefined;
                                    if (schema) {
                                        if (schema.type === 'integer') {
                                            transformedAttributes[key] =
                                                parseInt(value as string);
                                        } else if (schema.type === 'number') {
                                            transformedAttributes[key] =
                                                parseFloat(value as string);
                                        } else if (schema.type === 'boolean') {
                                            transformedAttributes[key] =
                                                value === 'true';
                                        } else {
                                            transformedAttributes[key] = value;
                                        }
                                    } else {
                                        transformedAttributes[key] = value;
                                    }
                                },
                            );
                        }

                        return {
                            ...data,
                            custom_attributes: transformedAttributes,
                            has_variants: hasVariants ? '1' : '0',
                        };
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            <Card>
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                        <Package className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Basic Information
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Configure product details
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <Label htmlFor="shop_id">
                                            Shop
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Select a shop',
                                                },
                                                ...shops.map((shop) => ({
                                                    value: shop.id.toString(),
                                                    label: shop.name,
                                                })),
                                            ]}
                                            placeholder="Select shop"
                                            onChange={(value) =>
                                                setShopId(
                                                    value
                                                        ? parseInt(value)
                                                        : '',
                                                )
                                            }
                                            defaultValue=""
                                        />
                                        <input
                                            type="hidden"
                                            name="shop_id"
                                            value={shopId}
                                        />
                                        <InputError message={errors.shop_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="name">
                                            Product Name
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={productName}
                                            onChange={(e) =>
                                                setProductName(e.target.value)
                                            }
                                            placeholder="e.g., Blue Cotton T-Shirt"
                                            error={!!errors.name}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="product_type_slug">
                                            Product Type
                                            <span className="text-error-500">
                                                {' '}
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Select a product type',
                                                },
                                                ...productTypes.map((type) => ({
                                                    value: type.slug,
                                                    label: type.label,
                                                })),
                                            ]}
                                            placeholder="Select product type"
                                            onChange={(value) =>
                                                setSelectedTypeSlug(value)
                                            }
                                            defaultValue=""
                                        />
                                        <input
                                            type="hidden"
                                            name="product_type_slug"
                                            value={selectedTypeSlug}
                                        />
                                        <InputError
                                            message={errors.product_type_slug}
                                        />
                                        {selectedType?.description && (
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                {selectedType.description}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="category_id">
                                            Category
                                        </Label>
                                        <Select
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'No category',
                                                },
                                                ...flattenCategories(
                                                    categories,
                                                ),
                                            ]}
                                            placeholder="Select category (optional)"
                                            onChange={(value) =>
                                                setCategoryId(
                                                    value
                                                        ? parseInt(value)
                                                        : '',
                                                )
                                            }
                                            defaultValue=""
                                        />
                                        <input
                                            type="hidden"
                                            name="category_id"
                                            value={categoryId}
                                        />
                                        <InputError
                                            message={errors.category_id}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <TextArea
                                            value={description}
                                            onChange={(val) =>
                                                setDescription(val)
                                            }
                                            placeholder="Product description..."
                                            rows={3}
                                        />
                                        <input
                                            type="hidden"
                                            name="description"
                                            value={description}
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
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
                                                Product is active and available
                                                for sale
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

                            {selectedType?.config_schema?.properties && (
                                <Card>
                                    <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                            <Tag className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Product Attributes
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Type-specific product details
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        {Object.entries(
                                            selectedType.config_schema
                                                .properties,
                                        ).map(([fieldName, schema]) => {
                                            const isRequired =
                                                selectedType.config_schema?.required?.includes(
                                                    fieldName,
                                                ) || false;
                                            return (
                                                <div key={fieldName}>
                                                    <DynamicSchemaField
                                                        fieldName={fieldName}
                                                        schema={
                                                            schema as SchemaProperty
                                                        }
                                                        value={
                                                            customAttributes[
                                                                fieldName
                                                            ]
                                                        }
                                                        onChange={(value) =>
                                                            handleCustomAttributeChange(
                                                                fieldName,
                                                                value,
                                                            )
                                                        }
                                                        required={isRequired}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`custom_attributes[${fieldName}]`}
                                                        value={
                                                            customAttributes[
                                                                fieldName
                                                            ] ?? ''
                                                        }
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            {selectedType && (
                                <Card>
                                    <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                            <Box className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Variants & Pricing
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Configure product variations and
                                                pricing
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="has_variants"
                                                checked={hasVariants}
                                                onChange={setHasVariants}
                                                disabled={
                                                    !selectedType.supports_variants
                                                }
                                                className="h-5 w-5"
                                            />
                                            <Label
                                                htmlFor="has_variants"
                                                className="mb-0 font-normal text-gray-700 dark:text-gray-400"
                                            >
                                                This product has multiple
                                                variants (e.g., sizes, colors)
                                            </Label>
                                        </div>
                                        {!selectedType.supports_variants && (
                                            <p className="mt-2 text-sm text-gray-500">
                                                This product type does not
                                                support variants
                                            </p>
                                        )}
                                    </div>

                                    {!hasVariants ? (
                                        <div className="space-y-5">
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="sku">
                                                        SKU
                                                        <span className="text-error-500">
                                                            {' '}
                                                            *
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        id="sku"
                                                        name="sku"
                                                        value={simpleSku}
                                                        onChange={(e) =>
                                                            setSimpleSku(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="SKU-001"
                                                        error={!!errors.sku}
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.sku}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="barcode">
                                                        Barcode
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        id="barcode"
                                                        name="barcode"
                                                        value={simpleBarcode}
                                                        onChange={(e) =>
                                                            setSimpleBarcode(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="123456789"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label htmlFor="base_unit_name">
                                                    Base Unit
                                                    <span className="text-error-500">
                                                        {' '}
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    type="text"
                                                    id="base_unit_name"
                                                    name="base_unit_name"
                                                    value={simpleBaseUnit}
                                                    onChange={(e) =>
                                                        setSimpleBaseUnit(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g., Piece, Bottle, Kilogram"
                                                    error={!!errors.base_unit_name}
                                                    required
                                                />
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    What unit does your inventory quantity represent?
                                                </p>
                                                <InputError
                                                    message={errors.base_unit_name}
                                                />
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="price">
                                                        Price (₦)
                                                        <span className="text-error-500">
                                                            {' '}
                                                            *
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        id="price"
                                                        name="price"
                                                        value={simplePrice}
                                                        onChange={(e) =>
                                                            setSimplePrice(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        min="0"
                                                        error={!!errors.price}
                                                        required
                                                    />
                                                    <InputError
                                                        message={errors.price}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="cost_price">
                                                        Cost Price (₦)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        id="cost_price"
                                                        name="cost_price"
                                                        value={simpleCostPrice}
                                                        onChange={(e) =>
                                                            setSimpleCostPrice(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {variants.map((variant, index) => (
                                                <div
                                                    key={variant.id}
                                                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                                                >
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                                            Variant #{index + 1}
                                                        </h3>
                                                        {variants.length >
                                                            1 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeVariant(
                                                                        variant.id!,
                                                                    )
                                                                }
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <Label
                                                                    htmlFor={`variant_sku_${variant.id}`}
                                                                >
                                                                    SKU *
                                                                </Label>
                                                                <Input
                                                                    type="text"
                                                                    value={
                                                                        variant.sku
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateVariant(
                                                                            variant.id!,
                                                                            'sku',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="SKU-001"
                                                                    required
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                    name={`variants[${index}][sku]`}
                                                                    value={
                                                                        variant.sku
                                                                    }
                                                                />
                                                            </div>

                                                            <div>
                                                                <Label
                                                                    htmlFor={`variant_name_${variant.id}`}
                                                                >
                                                                    Name
                                                                </Label>
                                                                <Input
                                                                    type="text"
                                                                    value={
                                                                        variant.name
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateVariant(
                                                                            variant.id!,
                                                                            'name',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="e.g., Large - Blue"
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                    name={`variants[${index}][name]`}
                                                                    value={
                                                                        variant.name
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <Label
                                                                    htmlFor={`variant_price_${variant.id}`}
                                                                >
                                                                    Price (₦) *
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        variant.price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateVariant(
                                                                            variant.id!,
                                                                            'price',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="0.00"
                                                                    step="0.01"
                                                                    min="0"
                                                                    required
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                    name={`variants[${index}][price]`}
                                                                    value={
                                                                        variant.price
                                                                    }
                                                                />
                                                            </div>

                                                            <div>
                                                                <Label
                                                                    htmlFor={`variant_cost_price_${variant.id}`}
                                                                >
                                                                    Cost Price (
                                                                    ₦)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        variant.cost_price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateVariant(
                                                                            variant.id!,
                                                                            'cost_price',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="0.00"
                                                                    step="0.01"
                                                                    min="0"
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                    name={`variants[${index}][cost_price]`}
                                                                    value={
                                                                        variant.cost_price
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <Label
                                                                    htmlFor={`variant_barcode_${variant.id}`}
                                                                >
                                                                    Barcode
                                                                </Label>
                                                                <Input
                                                                    type="text"
                                                                    value={
                                                                        variant.barcode
                                                                    }
                                                                    onChange={(e) =>
                                                                        updateVariant(
                                                                            variant.id!,
                                                                            'barcode',
                                                                            e.target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="123456789"
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                name={`variants[${index}][barcode]`}
                                                                value={
                                                                    variant.barcode
                                                                }
                                                            />
                                                            </div>

                                                            <div>
                                                                <Label
                                                                    htmlFor={`variant_base_unit_${variant.id}`}
                                                                >
                                                                    Base Unit *
                                                                </Label>
                                                                <Input
                                                                    type="text"
                                                                    value={
                                                                        variant.base_unit_name
                                                                    }
                                                                    onChange={(e) =>
                                                                        updateVariant(
                                                                            variant.id!,
                                                                            'base_unit_name',
                                                                            e.target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="e.g., Piece, Bottle, Kg"
                                                                    required
                                                                />
                                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    What unit does the stock quantity represent?
                                                                </p>
                                                                <input
                                                                    type="hidden"
                                                                    name={`variants[${index}][base_unit_name]`}
                                                                    value={
                                                                        variant.base_unit_name
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addVariant}
                                                className="w-full"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Variant
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            )}

                            <div className="flex gap-4">
                                <Link href={'/products'} className="flex-1">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Product'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
