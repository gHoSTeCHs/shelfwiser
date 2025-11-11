import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    DollarSign,
    Package,
    Plus,
    Search,
    Settings,
    Tag,
} from 'lucide-react';
import { useState } from 'react';

interface ProductType {
    id: number;
    slug: string;
    label: string;
}

interface ProductCategory {
    id: number;
    name: string;
    slug: string;
}

interface Shop {
    id: number;
    name: string;
    slug: string;
}

interface ProductVariant {
    id: number;
    sku: string;
    price: number;
    is_active: boolean;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    has_variants: boolean;
    is_active: boolean;
    type: ProductType;
    category: ProductCategory | null;
    shop: Shop;
    variants: ProductVariant[];
    variants_count: number;
    created_at: string;
}

interface ProductListResponse {
    data: Product[];
    total: number;
}

interface Props {
    products: ProductListResponse;
}

export default function Index({ products }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');

    const filteredProducts = products.data.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !selectedType || product.type.slug === selectedType;

        return matchesSearch && matchesType;
    });

    const getProductTypes = () => {
        const types = products.data.map((p) => p.type);
        const uniqueTypes = Array.from(
            new Map(types.map((t) => [t.slug, t])).values(),
        );
        return uniqueTypes;
    };

    return (
        <AppLayout>
            <Head title="Products" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Products
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage your product inventory
                        </p>
                    </div>
                    <Link href={'/products/create'}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Product
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="sm:w-48">
                        <Select
                            options={[
                                { value: '', label: 'All Product Types' },
                                ...getProductTypes().map((type) => ({
                                    value: type.slug,
                                    label: type.label,
                                })),
                            ]}
                            placeholder="All Product Types"
                            onChange={(value) => setSelectedType(value)}
                            defaultValue=""
                        />
                    </div>
                </div>

                {filteredProducts.length === 0 ? (
                    <EmptyState
                        icon={<Package className="h-12 w-12" />}
                        title="No products found"
                        description={
                            searchTerm || selectedType
                                ? 'Try adjusting your search criteria'
                                : 'Get started by creating your first product'
                        }
                        action={
                            !searchTerm && !selectedType ? (
                                <Link href={'/products/create'}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Product
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredProducts.map((product) => {
                            const minPrice = product.variants.length > 0
                                ? Math.min(...product.variants.map((v) => parseFloat(v.price.toString())))
                                : 0;

                            return (
                                <Card
                                    key={product.id}
                                    title={product.name}
                                    className="cursor-pointer transition-shadow hover:shadow-lg"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {product.slug}
                                            </p>
                                            <Badge
                                                variant={
                                                    product.is_active
                                                        ? 'light'
                                                        : 'solid'
                                                }
                                                color={
                                                    product.is_active
                                                        ? 'success'
                                                        : 'error'
                                                }
                                            >
                                                {product.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </div>

                                        {product.description && (
                                            <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <Tag className="mr-2 h-4 w-4" />
                                                {product.type.label}
                                            </div>

                                            {product.category && (
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                    <Package className="mr-2 h-4 w-4" />
                                                    {product.category.name}
                                                </div>
                                            )}

                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <Building2 className="mr-2 h-4 w-4" />
                                                {product.shop.name}
                                            </div>

                                            {product.variants.length > 0 && (
                                                <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                                    <DollarSign className="mr-1 h-4 w-4" />
                                                    {product.has_variants
                                                        ? `From ₦${minPrice.toLocaleString()}`
                                                        : `₦${parseFloat(product.variants[0].price.toString()).toLocaleString()}`}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                            <span>
                                                {product.variants_count}{' '}
                                                {product.variants_count === 1
                                                    ? 'variant'
                                                    : 'variants'}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={`/products/${product.id}`}
                                                className="flex-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    View
                                                </Button>
                                            </Link>
                                            <Link
                                                href={`/products/${product.id}/edit`}
                                                className="flex-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button className="w-full">
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Manage
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
