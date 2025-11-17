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
import ImageGallery from '@/components/images/ImageGallery';
import ImageUploader from '@/components/images/ImageUploader';
import AppLayout from '@/layouts/AppLayout';
import { flattenCategories } from '@/lib/utils.ts';
import { ProductCategory, ProductType } from '@/types/product';
import { ProductVariant } from '@/types/stockMovement';
import { Image } from '@/types/image';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Image as ImageIcon, Package, Save, Tag } from 'lucide-react';
import { useState } from 'react';

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    custom_attributes: Record<string, any> | null;
    has_variants: boolean;
    is_active: boolean;
    type: ProductType;
    category: ProductCategory | null;
    variants: ProductVariant[];
    images?: Image[];
}

interface Props {
    product: Product;
    productTypes: ProductType[];
    categories: ProductCategory[];
}

export default function Edit({ product, productTypes, categories }: Props) {
    const [productName, setProductName] = useState<string>(product.name);
    const [description, setDescription] = useState<string>(
        product.description || '',
    );
    const [categoryId, setCategoryId] = useState<number | ''>(
        product.category?.id || '',
    );
    const [customAttributes, setCustomAttributes] = useState<
        Record<string, any>
    >(product.custom_attributes || {});
    const [isActive, setIsActive] = useState<boolean>(product.is_active);

    const selectedType = productTypes.find(
        (type) => type.slug === product.type.slug,
    );

    const handleCustomAttributeChange = (fieldName: string, value: any) => {
        setCustomAttributes((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    return (
        <AppLayout>
            <Head title={`Edit ${product.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={`/products/${product.id}`}
                            className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Product
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Edit Product
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Update product information
                        </p>
                    </div>
                </div>

                <Form
                    action={ProductController.update.url({
                        product: product.id,
                    })}
                    method="put"
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
                                            Update product details
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
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
                                        <Label htmlFor="product_type">
                                            Product Type
                                        </Label>
                                        <Input
                                            type="text"
                                            id="product_type"
                                            value={product.type.label}
                                            disabled
                                            className="bg-gray-50 dark:bg-gray-800"
                                        />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Product type cannot be changed after
                                            creation
                                        </p>
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
                                            defaultValue={
                                                categoryId
                                                    ? categoryId.toString()
                                                    : ''
                                            }
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

                            <Card>
                                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                        <ImageIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Product Images
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Manage product images
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <ImageGallery
                                        images={product.images || []}
                                        modelType="Product"
                                        modelId={product.id}
                                        canManage={true}
                                        showPlaceholder={true}
                                    />

                                    <ImageUploader
                                        modelType="Product"
                                        modelId={product.id}
                                        maxFiles={10}
                                    />
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
                                                Update type-specific details
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

                                    <input
                                        type="hidden"
                                        name="product_type_slug"
                                        value={product.type.slug}
                                    />
                                </Card>
                            )}

                            {product.has_variants && (
                                <Card>
                                    <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                            <Package className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Product Variants
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {product.variants.length}{' '}
                                                variant(s)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {product.variants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {variant.name ||
                                                            'Default Variant'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        SKU: {variant.sku}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        To edit variant details (pricing,
                                        inventory, etc.), go to the product
                                        detail page.
                                    </p>
                                </Card>
                            )}

                            <div className="flex gap-4">
                                <Link
                                    href={`/products/${product.id}`}
                                    className="flex-1"
                                >
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
                                        ? 'Updating...'
                                        : 'Update Product'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
