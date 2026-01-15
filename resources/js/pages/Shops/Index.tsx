import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/badge/Badge';

import Button from '@/components/ui/button/Button.tsx';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Shop } from '@/types/shop';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Mail,
    MapPin,
    Package,
    Phone,
    Plus,
    Search,
    Settings,
    Store,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface ShopListResponse {
    data: Shop[];
    total: number;
}

interface ShopTypeOption {
    slug: string;
    label: string;
}

interface Props {
    shops: ShopListResponse;
    shopTypes: ShopTypeOption[];
}

export default function Index({ shops, shopTypes }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShopType, setSelectedShopType] = useState('');

    const filteredShops = shops.data.filter((shop) => {
        const matchesSearch =
            shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType =
            !selectedShopType || shop.type.slug === selectedShopType;

        return matchesSearch && matchesType;
    });

    return (
        <>
            <Head title="Shops" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Shops
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage your shops and locations
                        </p>
                    </div>
                    <Link href={'/shops/create'}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Shop
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search shops..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="sm:w-48">
                        <Select
                            options={[
                                { value: '', label: 'All Shop Types' },
                                ...shopTypes.map((type) => ({
                                    value: type.slug,
                                    label: type.label,
                                })),
                            ]}
                            placeholder="All Shop Types"
                            onChange={(value) => setSelectedShopType(value)}
                            defaultValue=""
                        />
                    </div>
                </div>

                {filteredShops.length === 0 ? (
                    <EmptyState
                        icon={<Building2 className="h-12 w-12" />}
                        title="No shops found"
                        description={
                            searchTerm || selectedShopType
                                ? 'Try adjusting your search criteria'
                                : 'Get started by creating your first shop'
                        }
                        action={
                            !searchTerm && !selectedShopType ? (
                                <Link href={'/shops/create'}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Shop
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredShops.map((shop) => (
                            <Card
                                key={shop.id}
                                title={shop.name}
                                className="cursor-pointer transition-shadow hover:shadow-lg"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {shop.slug}
                                        </p>
                                        <div className="flex gap-2">
                                            <Badge
                                                variant={
                                                    shop.is_active
                                                        ? 'light'
                                                        : 'solid'
                                                }
                                                color={
                                                    shop.is_active
                                                        ? 'success'
                                                        : 'error'
                                                }
                                            >
                                                {shop.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                            {shop.storefront_enabled && (
                                                <Badge
                                                    variant="light"
                                                    color="info"
                                                >
                                                    <Store className="mr-1 h-3 w-3" />
                                                    Storefront
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                            <Building2 className="mr-2 h-4 w-4" />
                                            {shop.type.label}
                                        </div>

                                        {/* Show address if available */}
                                        {(shop.city || shop.state) && (
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <MapPin className="mr-2 h-4 w-4" />
                                                {shop.city}
                                                {shop.state &&
                                                    `, ${shop.state}`}
                                            </div>
                                        )}

                                        {/* Show contact info */}
                                        {shop.phone && (
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <Phone className="mr-2 h-4 w-4" />
                                                {shop.phone}
                                            </div>
                                        )}

                                        {shop.email && (
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <Mail className="mr-2 h-4 w-4" />
                                                {shop.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <Users className="mr-1 h-4 w-4" />
                                            {shop.users_count || 0} staff
                                        </div>
                                        <div className="flex items-center">
                                            <Package className="mr-1 h-4 w-4" />
                                            {/* You'll need to add products_count relationship */}
                                            {shop.products_count || 0} products
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/shops/${shop.id}`}
                                                className="flex-1"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    View
                                                </Button>
                                            </Link>
                                            <Link
                                                href={`/shops/${shop.id}/edit`}
                                                className="flex-1"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Button className="w-full">
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Manage
                                                </Button>
                                            </Link>
                                        </div>
                                        <Link
                                            href={`/shops/${shop.id}/storefront-settings`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                            >
                                                <Store className="mr-2 h-4 w-4" />
                                                Storefront Settings
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
