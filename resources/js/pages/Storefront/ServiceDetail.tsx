import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import Checkbox from '@/components/form/input/Checkbox';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Breadcrumbs from '@/components/storefront/Breadcrumbs';
import ServiceCard from '@/components/storefront/ServiceCard';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import useCurrency from '@/hooks/useCurrency';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { MaterialOption } from '@/types/service';
import { StorefrontServiceDetailProps } from '@/types/storefront';
import { Form } from '@inertiajs/react';
import { Clock, ShoppingCart } from 'lucide-react';
import React from 'react';

/**
 * Individual service detail page.
 * Shows service details, variants, material options, addons, and booking functionality.
 */
const ServiceDetail: React.FC<StorefrontServiceDetailProps> = ({
    shop,
    service,
    categoryAddons,
    relatedServices,
    cartSummary,
}) => {
    const { formatCurrency } = useCurrency(shop);
    const [selectedVariantId, setSelectedVariantId] = React.useState(
        service.variants?.[0]?.id || 0,
    );
    const [materialOption, setMaterialOption] =
        React.useState<MaterialOption>('none');
    const [selectedAddons, setSelectedAddons] = React.useState<
        Record<number, number>
    >({});

    const selectedVariant = service.variants?.find(
        (v) => v.id === selectedVariantId,
    );

    // Calculate price based on variant and material option
    const calculatePrice = () => {
        if (!selectedVariant) return 0;

        if (!service.has_material_options) {
            return selectedVariant.base_price;
        }

        switch (materialOption) {
            case 'customer_materials':
                return (
                    selectedVariant.customer_materials_price ||
                    selectedVariant.base_price
                );
            case 'shop_materials':
                return (
                    selectedVariant.shop_materials_price ||
                    selectedVariant.base_price
                );
            default:
                return selectedVariant.base_price;
        }
    };

    const basePrice = calculatePrice();

    // Calculate addons total
    const addonsTotal = React.useMemo(() => {
        let total = 0;
        const allAddons = [
            ...(service.addons || []),
            ...(categoryAddons || []),
        ];

        Object.entries(selectedAddons).forEach(([addonId, quantity]) => {
            const addon = allAddons.find((a) => a.id === parseInt(addonId));
            if (addon && quantity > 0) {
                total += addon.price * quantity;
            }
        });

        return total;
    }, [selectedAddons, service.addons, categoryAddons]);

    const totalPrice = basePrice + addonsTotal;

    const variantOptions =
        service.variants?.map((variant) => ({
            value: variant.id.toString(),
            label: variant.name,
        })) || [];

    const materialOptions: {
        value: MaterialOption;
        label: string;
        description: string;
    }[] = [
        {
            value: 'none',
            label: 'Base Service',
            description: 'Basic service without materials',
        },
        {
            value: 'customer_materials',
            label: 'I provide materials',
            description: 'Customer supplies their own materials',
        },
        {
            value: 'shop_materials',
            label: 'Shop provides materials',
            description: 'We supply all materials',
        },
    ];

    const handleAddonToggle = (addonId: number) => {
        setSelectedAddons((prev) => {
            const current = prev[addonId] || 0;
            if (current > 0) {
                const { [addonId]: _, ...rest } = prev;
                return rest;
            } else {
                return { ...prev, [addonId]: 1 };
            }
        });
    };

    const handleAddonQuantityChange = (
        addonId: number,
        quantity: number,
        maxQuantity: number | null,
    ) => {
        if (quantity <= 0) {
            const { [addonId]: _, ...rest } = selectedAddons;
            setSelectedAddons(rest);
        } else {
            const finalQuantity = maxQuantity
                ? Math.min(quantity, maxQuantity)
                : quantity;
            setSelectedAddons((prev) => ({
                ...prev,
                [addonId]: finalQuantity,
            }));
        }
    };

    const allAddons = [...(service.addons || []), ...(categoryAddons || [])];

    return (
        <StorefrontLayout shop={shop} cartItemCount={cartSummary.item_count}>
            <div className="space-y-8">
                <Breadcrumbs
                    items={[
                        {
                            label: 'Home',
                            href: StorefrontController.index.url({
                                shop: shop.slug,
                            }),
                        },
                        {
                            label: 'Services',
                            href: StorefrontController.services.url({
                                shop: shop.slug,
                            }),
                        },
                        ...(service.category
                            ? [{ label: service.category.name }]
                            : []),
                        { label: service.name },
                    ]}
                />

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Service Image */}
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                        {service.image_url ? (
                            <img
                                src={service.image_url}
                                alt={service.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <svg
                                    className="h-32 w-32"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Service Details */}
                    <div className="space-y-6">
                        <div>
                            {service.category && (
                                <p className="mb-2 text-sm text-gray-500">
                                    {service.category.name}
                                </p>
                            )}
                            <h1 className="mb-2 text-3xl font-bold text-gray-900">
                                {service.name}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(totalPrice)}
                                </p>
                                {addonsTotal > 0 && (
                                    <p className="text-sm text-gray-500">
                                        Base: {formatCurrency(basePrice)} + Addons:{' '}
                                        {formatCurrency(addonsTotal)}
                                    </p>
                                )}
                            </div>

                            {selectedVariant?.estimated_duration_minutes && (
                                <Badge
                                    color="info"
                                    startIcon={<Clock className="h-4 w-4" />}
                                >
                                    {selectedVariant.estimated_duration_minutes}{' '}
                                    minutes
                                </Badge>
                            )}
                        </div>

                        {service.description && (
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-600">
                                    {service.description}
                                </p>
                            </div>
                        )}

                        <Card className="space-y-6 p-6">
                            {/* Variant Selection */}
                            {service.variants &&
                                service.variants.length > 1 && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-900">
                                            Select Option
                                        </label>
                                        <Select
                                            options={variantOptions}
                                            defaultValue={selectedVariantId.toString()}
                                            onChange={(value) =>
                                                setSelectedVariantId(
                                                    parseInt(value),
                                                )
                                            }
                                        />
                                        {selectedVariant?.description && (
                                            <p className="mt-2 text-sm text-gray-600">
                                                {selectedVariant.description}
                                            </p>
                                        )}
                                    </div>
                                )}

                            {/* Material Options */}
                            {service.has_material_options && (
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-gray-900">
                                        Material Options
                                    </label>
                                    <div className="space-y-2">
                                        {materialOptions.map((option) => (
                                            <div
                                                key={option.value}
                                                className={`cursor-pointer rounded-lg border p-3 transition ${
                                                    materialOption ===
                                                    option.value
                                                        ? 'border-brand-500 bg-brand-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() =>
                                                    setMaterialOption(
                                                        option.value,
                                                    )
                                                }
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        checked={
                                                            materialOption ===
                                                            option.value
                                                        }
                                                        onChange={() =>
                                                            setMaterialOption(
                                                                option.value,
                                                            )
                                                        }
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">
                                                            {option.label}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Addons */}
                            {allAddons.length > 0 && (
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-gray-900">
                                        Additional Services (Optional)
                                    </label>
                                    <div className="space-y-3">
                                        {allAddons.map((addon) => (
                                            <div
                                                key={addon.id}
                                                className="rounded-lg border border-gray-200 p-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex flex-1 items-start gap-3">
                                                        <Checkbox
                                                            id={`addon-${addon.id}`}
                                                            checked={
                                                                (selectedAddons[
                                                                    addon.id
                                                                ] || 0) > 0
                                                            }
                                                            onChange={() =>
                                                                handleAddonToggle(
                                                                    addon.id,
                                                                )
                                                            }
                                                        />
                                                        <div className="flex-1">
                                                            <Label
                                                                htmlFor={`addon-${addon.id}`}
                                                                className="mb-0 font-medium text-gray-900"
                                                            >
                                                                {addon.name}
                                                            </Label>
                                                            {addon.description && (
                                                                <p className="mt-1 text-sm text-gray-500">
                                                                    {
                                                                        addon.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium text-gray-900">
                                                            +{formatCurrency(addon.price)}
                                                        </p>
                                                        {addon.allows_quantity &&
                                                            (selectedAddons[
                                                                addon.id
                                                            ] || 0) > 0 && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            handleAddonQuantityChange(
                                                                                addon.id,
                                                                                (selectedAddons[
                                                                                    addon
                                                                                        .id
                                                                                ] ||
                                                                                    0) -
                                                                                    1,
                                                                                addon.max_quantity,
                                                                            )
                                                                        }
                                                                        className="rounded border px-2 py-1"
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <span className="text-sm font-medium">
                                                                        {selectedAddons[
                                                                            addon
                                                                                .id
                                                                        ] || 0}
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleAddonQuantityChange(
                                                                                addon.id,
                                                                                (selectedAddons[
                                                                                    addon
                                                                                        .id
                                                                                ] ||
                                                                                    0) +
                                                                                    1,
                                                                                addon.max_quantity,
                                                                            )
                                                                        }
                                                                        className="rounded border px-2 py-1"
                                                                        disabled={
                                                                            addon.max_quantity !==
                                                                                null &&
                                                                            (selectedAddons[
                                                                                addon
                                                                                    .id
                                                                            ] ||
                                                                                0) >=
                                                                                addon.max_quantity
                                                                        }
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add to Cart Button */}
                            {selectedVariant && (
                                <Form
                                    action={CartController.storeService.url({
                                        shop: shop.slug,
                                    })}
                                    method="post"
                                    transform={(data) => ({
                                        service_variant_id: selectedVariantId,
                                        quantity: 1,
                                        material_option:
                                            service.has_material_options
                                                ? materialOption
                                                : null,
                                        selected_addons: Object.entries(
                                            selectedAddons,
                                        )
                                            .filter(([_, qty]) => qty > 0)
                                            .map(([addonId, quantity]) => ({
                                                addon_id: parseInt(addonId),
                                                quantity: quantity,
                                            })),
                                    })}
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            fullWidth
                                            startIcon={<ShoppingCart />}
                                            disabled={processing}
                                            loading={processing}
                                        >
                                            {processing
                                                ? 'Adding to Cart...'
                                                : `Book Service - ${formatCurrency(totalPrice)}`}
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Related Services */}
                {relatedServices && relatedServices.length > 0 && (
                    <div>
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">
                            Related Services
                        </h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {relatedServices.map((relatedService) => (
                                <ServiceCard
                                    key={relatedService.id}
                                    service={relatedService}
                                    shop={shop}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {(!relatedServices || relatedServices.length === 0) && (
                    <div className="py-8 text-center text-gray-500">
                        <p>No related services available at this time.</p>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
};

export default ServiceDetail;
