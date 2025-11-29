/* eslint-disable @typescript-eslint/no-explicit-any */

import ProductVariantController from '@/actions/App/Http/Controllers/ProductVariantController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Product } from '@/types/product';
import { ProductVariant } from '@/types/stockMovement';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { useState } from 'react';

interface Props {
    variant: ProductVariant;
    product: Product;
}

export default function Edit({ variant, product }: Props) {
    const [sku, setSku] = useState<string>(variant.sku || '');
    const [barcode, setBarcode] = useState<string>(variant.barcode || '');
    const [variantName, setVariantName] = useState<string>(variant.name || '');
    const [price, setPrice] = useState<string>(variant.price?.toString() || '0');
    const [costPrice, setCostPrice] = useState<string>(
        variant.cost_price?.toString() || '0',
    );
    const [reorderLevel, setReorderLevel] = useState<string>(
        variant.reorder_level?.toString() || '0',
    );
    const [baseUnitName, setBaseUnitName] = useState<string>(
        variant.base_unit_name || 'Unit',
    );
    const [batchNumber, setBatchNumber] = useState<string>(
        variant.batch_number || '',
    );
    const [expiryDate, setExpiryDate] = useState<string>(
        variant.expiry_date || '',
    );
    const [serialNumber, setSerialNumber] = useState<string>(
        variant.serial_number || '',
    );
    const [isActive, setIsActive] = useState<boolean>(
        variant.is_active ?? true,
    );
    const [isAvailableOnline, setIsAvailableOnline] = useState<boolean>(
        variant.is_available_online ?? false,
    );
    const [maxOrderQuantity, setMaxOrderQuantity] = useState<string>(
        variant.max_order_quantity?.toString() || '',
    );

    return (
        <AppLayout>
            <Head title={`Edit Variant - ${product.name}`} />

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
                            Edit Variant
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Update variant details for {product.name}
                        </p>
                    </div>
                </div>

                <Form
                    action={ProductVariantController.update.url({
                        variant: variant.id,
                    })}
                    method="put"
                    className="space-y-6"
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
                                            Variant Information
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Update pricing, SKU, and other
                                            details
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Variant Name */}
                                    <div>
                                        <Label htmlFor="name">
                                            Variant Name{' '}
                                            <span className="text-gray-400">
                                                (Optional)
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={variantName}
                                            onChange={(e) =>
                                                setVariantName(e.target.value)
                                            }
                                            placeholder="e.g., Large, Red, 500ml"
                                            error={!!errors.name}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    {/* SKU */}
                                    <div>
                                        <Label htmlFor="sku">
                                            SKU{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="sku"
                                            name="sku"
                                            value={sku}
                                            onChange={(e) =>
                                                setSku(e.target.value)
                                            }
                                            placeholder="e.g., PROD-001"
                                            required
                                            error={!!errors.sku}
                                        />
                                        <InputError message={errors.sku} />
                                    </div>

                                    {/* Barcode */}
                                    <div>
                                        <Label htmlFor="barcode">
                                            Barcode{' '}
                                            <span className="text-gray-400">
                                                (Optional)
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="barcode"
                                            name="barcode"
                                            value={barcode}
                                            onChange={(e) =>
                                                setBarcode(e.target.value)
                                            }
                                            placeholder="e.g., 123456789012"
                                            error={!!errors.barcode}
                                        />
                                        <InputError message={errors.barcode} />
                                    </div>

                                    {/* Base Unit Name */}
                                    <div>
                                        <Label htmlFor="base_unit_name">
                                            Base Unit Name
                                        </Label>
                                        <Input
                                            type="text"
                                            id="base_unit_name"
                                            name="base_unit_name"
                                            value={baseUnitName}
                                            onChange={(e) =>
                                                setBaseUnitName(e.target.value)
                                            }
                                            placeholder="e.g., Piece, Kg, Liter"
                                            error={!!errors.base_unit_name}
                                        />
                                        <InputError
                                            message={errors.base_unit_name}
                                        />
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <Label htmlFor="price">
                                            Selling Price{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="number"
                                            id="price"
                                            name="price"
                                            value={price}
                                            onChange={(e) =>
                                                setPrice(e.target.value)
                                            }
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            required
                                            error={!!errors.price}
                                        />
                                        <InputError message={errors.price} />
                                    </div>

                                    {/* Cost Price */}
                                    <div>
                                        <Label htmlFor="cost_price">
                                            Cost Price{' '}
                                            <span className="text-gray-400">
                                                (Optional)
                                            </span>
                                        </Label>
                                        <Input
                                            type="number"
                                            id="cost_price"
                                            name="cost_price"
                                            value={costPrice}
                                            onChange={(e) =>
                                                setCostPrice(e.target.value)
                                            }
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            error={!!errors.cost_price}
                                        />
                                        <InputError
                                            message={errors.cost_price}
                                        />
                                    </div>

                                    {/* Reorder Level */}
                                    <div>
                                        <Label htmlFor="reorder_level">
                                            Reorder Level{' '}
                                            <span className="text-gray-400">
                                                (Optional)
                                            </span>
                                        </Label>
                                        <Input
                                            type="number"
                                            id="reorder_level"
                                            name="reorder_level"
                                            value={reorderLevel}
                                            onChange={(e) =>
                                                setReorderLevel(e.target.value)
                                            }
                                            placeholder="0"
                                            min="0"
                                            error={!!errors.reorder_level}
                                        />
                                        <InputError
                                            message={errors.reorder_level}
                                        />
                                    </div>

                                    {/* Max Order Quantity */}
                                    <div>
                                        <Label htmlFor="max_order_quantity">
                                            Max Order Quantity{' '}
                                            <span className="text-gray-400">
                                                (Optional)
                                            </span>
                                        </Label>
                                        <Input
                                            type="number"
                                            id="max_order_quantity"
                                            name="max_order_quantity"
                                            value={maxOrderQuantity}
                                            onChange={(e) =>
                                                setMaxOrderQuantity(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="0"
                                            min="0"
                                            error={!!errors.max_order_quantity}
                                        />
                                        <InputError
                                            message={errors.max_order_quantity}
                                        />
                                    </div>
                                </div>

                                {/* Tracking Information */}
                                <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                                        Tracking Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        {/* Batch Number */}
                                        <div>
                                            <Label htmlFor="batch_number">
                                                Batch Number{' '}
                                                <span className="text-gray-400">
                                                    (Optional)
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="batch_number"
                                                name="batch_number"
                                                value={batchNumber}
                                                onChange={(e) =>
                                                    setBatchNumber(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., BATCH-2024-001"
                                                error={!!errors.batch_number}
                                            />
                                            <InputError
                                                message={errors.batch_number}
                                            />
                                        </div>

                                        {/* Expiry Date */}
                                        <div>
                                            <Label htmlFor="expiry_date">
                                                Expiry Date{' '}
                                                <span className="text-gray-400">
                                                    (Optional)
                                                </span>
                                            </Label>
                                            <Input
                                                type="date"
                                                id="expiry_date"
                                                name="expiry_date"
                                                value={expiryDate}
                                                onChange={(e) =>
                                                    setExpiryDate(
                                                        e.target.value,
                                                    )
                                                }
                                                error={!!errors.expiry_date}
                                            />
                                            <InputError
                                                message={errors.expiry_date}
                                            />
                                        </div>

                                        {/* Serial Number */}
                                        <div>
                                            <Label htmlFor="serial_number">
                                                Serial Number{' '}
                                                <span className="text-gray-400">
                                                    (Optional)
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="serial_number"
                                                name="serial_number"
                                                value={serialNumber}
                                                onChange={(e) =>
                                                    setSerialNumber(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., SN123456"
                                                error={!!errors.serial_number}
                                            />
                                            <InputError
                                                message={errors.serial_number}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status Toggles */}
                                <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                                        Status & Availability
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Is Active */}
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="is_active"
                                                name="is_active"
                                                checked={isActive}
                                                onChange={(e) =>
                                                    setIsActive(e.target.checked)
                                                }
                                            />
                                            <Label
                                                htmlFor="is_active"
                                                className="mb-0 cursor-pointer"
                                            >
                                                Active
                                                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                    (Enable this variant for
                                                    sales)
                                                </span>
                                            </Label>
                                        </div>

                                        {/* Is Available Online */}
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="is_available_online"
                                                name="is_available_online"
                                                checked={isAvailableOnline}
                                                onChange={(e) =>
                                                    setIsAvailableOnline(
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor="is_available_online"
                                                className="mb-0 cursor-pointer"
                                            >
                                                Available Online
                                                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                    (Show in e-commerce
                                                    storefront)
                                                </span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3">
                                <Link
                                    href={`/products/${product.id}`}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </Link>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                    loading={processing}
                                    startIcon={<Save className="h-4 w-4" />}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
