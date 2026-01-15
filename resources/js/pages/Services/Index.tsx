import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { ServiceListResponse } from '@/types/service';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Clock,
    DollarSign,
    Plus,
    Search,
    Settings,
    Sparkles,
    Tag,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    services: ServiceListResponse;
}

export default function Index({ services }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedShop, setSelectedShop] = useState('');

    const filteredServices = services.data.filter((service) => {
        const matchesSearch =
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            !selectedCategory ||
            service.category?.id.toString() === selectedCategory;
        const matchesShop =
            !selectedShop || service.shop?.id.toString() === selectedShop;

        return matchesSearch && matchesCategory && matchesShop;
    });

    const getCategories = () => {
        const categories = services.data.map((s) => s.category).filter(Boolean);
        return Array.from(new Map(categories.map((c) => [c!.id, c])).values());
    };

    const getShops = () => {
        const shops = services.data.map((s) => s.shop).filter(Boolean);
        return Array.from(new Map(shops.map((s) => [s!.id, s])).values());
    };

    return (
        <>
            <Head title="Services" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Services
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage your service offerings
                        </p>
                    </div>
                    <Link href={'/services/create'}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Service
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search services..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 sm:w-48">
                            <Select
                                options={[
                                    { value: '', label: 'All Categories' },
                                    ...getCategories().map((cat) => ({
                                        value: cat!.id.toString(),
                                        label: cat!.name,
                                    })),
                                ]}
                                placeholder="All Categories"
                                onChange={(value) => setSelectedCategory(value)}
                                defaultValue=""
                            />
                        </div>
                        <div className="flex-1 sm:w-48">
                            <Select
                                options={[
                                    { value: '', label: 'All Shops' },
                                    ...getShops().map((shop) => ({
                                        value: shop!.id.toString(),
                                        label: shop!.name,
                                    })),
                                ]}
                                placeholder="All Shops"
                                onChange={(value) => setSelectedShop(value)}
                                defaultValue=""
                            />
                        </div>
                    </div>
                </div>

                {filteredServices.length === 0 ? (
                    <EmptyState
                        icon={<Sparkles className="h-12 w-12" />}
                        title="No services found"
                        description={
                            searchTerm || selectedCategory || selectedShop
                                ? 'Try adjusting your search criteria'
                                : 'Get started by creating your first service'
                        }
                        action={
                            !searchTerm &&
                            !selectedCategory &&
                            !selectedShop ? (
                                <Link href={'/services/create'}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Service
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredServices.map((service) => {
                            const minPrice =
                                service.variants && service.variants.length > 0
                                    ? Math.min(
                                          ...service.variants.map((v) =>
                                              parseFloat(
                                                  v.base_price.toString(),
                                              ),
                                          ),
                                      )
                                    : 0;

                            const avgDuration =
                                service.variants && service.variants.length > 0
                                    ? Math.round(
                                          service.variants.reduce(
                                              (sum, v) =>
                                                  sum +
                                                  (v.estimated_duration_minutes ||
                                                      0),
                                              0,
                                          ) / service.variants.length,
                                      )
                                    : null;

                            return (
                                <Card
                                    key={service.id}
                                    title={service.name}
                                    className="cursor-pointer transition-shadow hover:shadow-lg"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {service.slug}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        service.is_active
                                                            ? 'light'
                                                            : 'solid'
                                                    }
                                                    color={
                                                        service.is_active
                                                            ? 'success'
                                                            : 'error'
                                                    }
                                                >
                                                    {service.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                                {service.is_available_online && (
                                                    <Badge
                                                        variant="light"
                                                        color="info"
                                                    >
                                                        Online
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {service.description && (
                                            <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                                                {service.description}
                                            </p>
                                        )}

                                        <div className="space-y-2">
                                            {service.category && (
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                    <Tag className="mr-2 h-4 w-4" />
                                                    {service.category.name}
                                                </div>
                                            )}

                                            {service.shop && (
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                    <Building2 className="mr-2 h-4 w-4" />
                                                    {service.shop.name}
                                                </div>
                                            )}

                                            {avgDuration && avgDuration > 0 && (
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    ~{avgDuration} minutes
                                                </div>
                                            )}

                                            {service.variants &&
                                                service.variants.length > 0 && (
                                                    <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                                        <DollarSign className="mr-1 h-4 w-4" />
                                                        From ₦
                                                        {minPrice.toLocaleString()}
                                                    </div>
                                                )}
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                            <span>
                                                {service.variants_count || 0}{' '}
                                                {service.variants_count === 1
                                                    ? 'variant'
                                                    : 'variants'}
                                            </span>
                                            {service.has_material_options && (
                                                <Badge
                                                    variant="light"
                                                    color="warning"
                                                    size="sm"
                                                >
                                                    Materials
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={`/services/${service.id}`}
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
                                                href={`/services/${service.id}/edit`}
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
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
