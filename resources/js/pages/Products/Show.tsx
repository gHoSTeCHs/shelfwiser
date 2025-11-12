/* eslint-disable @typescript-eslint/no-explicit-any */

import StockAdjustmentModal from '@/components/stock/StockAdjustmentModal';
import StockLevelBadge from '@/components/stock/StockLevelBadge';
import StockTransferModal from '@/components/stock/StockTransferModal';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/card/Card';
import { useModal } from '@/hooks/useModal';
import AppLayout from '@/layouts/AppLayout';
import { ProductCategory, ProductType } from '@/types/product.ts';
import { Shop } from '@/types/shop.ts';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRightLeft,
    Barcode,
    Box,
    Building2,
    Calendar,
    ChevronLeft,
    DollarSign,
    Edit,
    Package,
    Plus,
    Tag,
    TrendingUp,
    Warehouse
} from 'lucide-react';
import { useState } from 'react';

interface InventoryLocation {
    id: number;
    location_type: string;
    location_id: number;
    quantity: number;
    reserved_quantity: number;
}

interface ProductVariant {
    id: number;
    sku: string;
    barcode: string | null;
    name: string | null;
    attributes: Record<string, string> | null;
    price: number;
    cost_price: number | null;
    reorder_level: number;
    image_url: string | null;
    images: string[] | null;
    batch_number: string | null;
    expiry_date: string | null;
    serial_number: string | null;
    is_active: boolean;
    inventory_locations: InventoryLocation[];
}

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
    shop: Shop;
    variants: ProductVariant[];
    created_at: string;
    updated_at: string;
}

interface Props {
    product: Product;
    can_manage: boolean;
}

export default function Show({ product, can_manage }: Props) {
    console.log(product);

    // Initialize with first variant if available
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
        product.variants.length > 0 ? product.variants[0] : null
    );
    const adjustStockModal = useModal();
    const transferStockModal = useModal();

    const getTotalStock = (variant: ProductVariant): number => {
        return variant.inventory_locations.reduce(
            (sum, loc) => sum + loc.quantity,
            0,
        );
    };

    const getAvailableStock = (variant: ProductVariant): number => {
        return variant.inventory_locations.reduce(
            (sum, loc) => sum + (loc.quantity - loc.reserved_quantity),
            0,
        );
    };

    const handleAdjustStock = (variant: ProductVariant) => {
        setSelectedVariant(variant);
        adjustStockModal.openModal();
    };

    const handleTransferStock = (variant: ProductVariant) => {
        setSelectedVariant(variant);
        transferStockModal.openModal();
    };

    const handleVariantSelect = (variant: ProductVariant) => {
        setSelectedVariant(variant);
    };

    const formatPrice = (price: number): string => {
        return `₦${parseFloat(price.toString()).toLocaleString()}`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout>
            <Head title={`${product.name} - Product Details`} />

            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={'/products'}
                            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Back to Products
                        </Link>
                    </div>

                    {can_manage && (
                        <Link href={`/products/${product.id}/edit`}>
                            <Button size="sm" className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Product
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {product.name}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <Badge
                                variant="light"
                                color={product.is_active ? 'success' : 'error'}
                            >
                                {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Slug: {product.slug}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card title="Product Information">
                            <div className="space-y-4">
                                {product.description && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Description
                                        </p>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {product.description}
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <Tag className="mr-2 h-4 w-4" />
                                            Product Type
                                        </p>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {product.type.label}
                                        </p>
                                    </div>

                                    {product.category && (
                                        <div>
                                            <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                                <Package className="mr-2 h-4 w-4" />
                                                Category
                                            </p>
                                            <p className="mt-1 text-gray-900 dark:text-white">
                                                {product.category.name}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <Building2 className="mr-2 h-4 w-4" />
                                            Shop
                                        </p>
                                        <Link
                                            href={`/shops/${product.shop.id}`}
                                            className="mt-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                        >
                                            {product.shop.name}
                                        </Link>
                                    </div>

                                    <div>
                                        <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <Box className="mr-2 h-4 w-4" />
                                            Variants
                                        </p>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {product.variants.length}{' '}
                                            {product.has_variants
                                                ? 'variants'
                                                : 'variant'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {product.custom_attributes &&
                            Object.keys(product.custom_attributes).length >
                            0 && (
                                <Card title="Product Attributes">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {Object.entries(
                                            product.custom_attributes,
                                        ).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-sm font-medium text-gray-500 capitalize dark:text-gray-400">
                                                    {key.replace(/_/g, ' ')}
                                                </p>
                                                <p className="mt-1 text-gray-900 dark:text-white">
                                                    {typeof value === 'boolean'
                                                        ? value
                                                            ? 'Yes'
                                                            : 'No'
                                                        : Array.isArray(value)
                                                            ? value.join(', ')
                                                            : typeof value ===
                                                            'object'
                                                                ? JSON.stringify(
                                                                    value,
                                                                )
                                                                : value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                        <Card title="Variants & Pricing">
                            <div className="space-y-4">
                                {product.variants.map((variant) => {
                                    const totalStock = getTotalStock(variant);
                                    const availableStock =
                                        getAvailableStock(variant);
                                    const isSelected = selectedVariant?.id === variant.id;

                                    return (
                                        <div
                                            key={variant.id}
                                            className={`
                                                cursor-pointer rounded-lg border p-4 transition-all
                                                ${isSelected
                                                ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500 dark:border-brand-400 dark:bg-brand-950/50 dark:ring-brand-400'
                                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                            }
                                            `}
                                            onClick={() => handleVariantSelect(variant)}
                                        >
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {variant.name ||
                                                                'Default Variant'}
                                                        </h3>
                                                        {isSelected && (
                                                            <Badge variant="solid" color="primary" size="sm">
                                                                Selected
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                        <Barcode className="mr-1 h-4 w-4" />
                                                        SKU: {variant.sku}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="light"
                                                    color={
                                                        variant.is_active
                                                            ? 'success'
                                                            : 'error'
                                                    }
                                                >
                                                    {variant.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                <div>
                                                    <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        <DollarSign className="mr-1 h-4 w-4" />
                                                        Price
                                                    </p>
                                                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                        {formatPrice(
                                                            variant.price,
                                                        )}
                                                    </p>
                                                </div>

                                                {variant.cost_price && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            Cost Price
                                                        </p>
                                                        <p className="mt-1 text-gray-900 dark:text-white">
                                                            {formatPrice(
                                                                variant.cost_price,
                                                            )}
                                                        </p>
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        <Warehouse className="mr-1 h-4 w-4" />
                                                        Stock
                                                    </p>
                                                    <div className="mt-1">
                                                        <StockLevelBadge
                                                            totalStock={
                                                                totalStock
                                                            }
                                                            availableStock={
                                                                availableStock
                                                            }
                                                            size="sm"
                                                        />
                                                    </div>
                                                </div>

                                                {variant.barcode && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            Barcode
                                                        </p>
                                                        <p className="font-mono mt-1 text-sm text-gray-900 dark:text-white">
                                                            {variant.barcode}
                                                        </p>
                                                    </div>
                                                )}

                                                {variant.batch_number && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            Batch Number
                                                        </p>
                                                        <p className="mt-1 text-gray-900 dark:text-white">
                                                            {
                                                                variant.batch_number
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                                {variant.expiry_date && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            Expiry Date
                                                        </p>
                                                        <p className="mt-1 text-gray-900 dark:text-white">
                                                            {formatDate(
                                                                variant.expiry_date,
                                                            )}
                                                        </p>
                                                    </div>
                                                )}

                                                {variant.serial_number && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            Serial Number
                                                        </p>
                                                        <p className="font-mono mt-1 text-sm text-gray-900 dark:text-white">
                                                            {
                                                                variant.serial_number
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {variant.attributes &&
                                                Object.keys(variant.attributes)
                                                    .length > 0 && (
                                                    <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                                                        <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            Variant Attributes
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(
                                                                variant.attributes,
                                                            ).map(
                                                                ([
                                                                     key,
                                                                     value,
                                                                 ]) => (
                                                                    <Badge
                                                                        key={
                                                                            key
                                                                        }
                                                                        variant="light"
                                                                    >
                                                                        {key}:{' '}
                                                                        {value}
                                                                    </Badge>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            {can_manage &&
                                                variant.inventory_locations
                                                    .length > 0 && (
                                                    <div
                                                        className="mt-4 flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAdjustStock(variant)}
                                                            className="flex-1"
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Adjust Stock
                                                        </Button>
                                                        {variant
                                                            .inventory_locations
                                                            .length > 1 && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleTransferStock(variant)}
                                                                className="flex-1"
                                                            >
                                                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                                Transfer
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card title="Quick Stats">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Total Variants
                                        </span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {product.variants.length}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Total Stock
                                        </span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {product.variants.reduce(
                                                (sum, v) =>
                                                    sum + getTotalStock(v),
                                                0,
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Available
                                        </span>
                                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {product.variants.reduce(
                                                (sum, v) =>
                                                    sum + getAvailableStock(v),
                                                0,
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {product.variants.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                Price Range
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {product.has_variants &&
                                                product.variants.length > 1
                                                    ? `${formatPrice(
                                                        Math.min(
                                                            ...product.variants.map(
                                                                (v) =>
                                                                    parseFloat(
                                                                        v.price.toString(),
                                                                    ),
                                                            ),
                                                        ),
                                                    )} - ${formatPrice(
                                                        Math.max(
                                                            ...product.variants.map(
                                                                (v) =>
                                                                    parseFloat(
                                                                        v.price.toString(),
                                                                    ),
                                                            ),
                                                        ),
                                                    )}`
                                                    : formatPrice(
                                                        product.variants[0]
                                                            .price,
                                                    )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card title="Timeline">
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Created
                                    </span>
                                    <span className="ml-auto text-gray-900 dark:text-white">
                                        {formatDate(product.created_at)}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <TrendingUp className="mr-2 h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Updated
                                    </span>
                                    <span className="ml-auto text-gray-900 dark:text-white">
                                        {formatDate(product.updated_at)}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {selectedVariant && (
                <>
                    <StockAdjustmentModal
                        isOpen={adjustStockModal.isOpen}
                        onClose={adjustStockModal.closeModal}
                        variant={{
                            ...selectedVariant,
                            product: {
                                id: product.id,
                                name: product.name,
                                slug: product.slug,
                                shop_id: product.shop.id,
                            },
                        }}
                        locations={selectedVariant.inventory_locations.map(
                            (loc) => ({
                                ...loc,
                                locatable: {
                                    id: loc.location_id,
                                    name: product.shop.name,
                                },
                            }),
                        )}
                    />
                    <StockTransferModal
                        isOpen={transferStockModal.isOpen}
                        onClose={transferStockModal.closeModal}
                        variant={{
                            ...selectedVariant,
                            product: {
                                id: product.id,
                                name: product.name,
                                slug: product.slug,
                                shop_id: product.shop.id,
                            },
                        }}
                        locations={selectedVariant.inventory_locations.map(
                            (loc) => ({
                                ...loc,
                                locatable: {
                                    id: loc.location_id,
                                    name: product.shop.name,
                                },
                            }),
                        )}
                    />
                </>
            )}
        </AppLayout>
    );
}
