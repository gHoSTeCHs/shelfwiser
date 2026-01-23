import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import Button from '@/components/ui/button/Button';
import useCart from '@/hooks/useCart';
import useCurrency from '@/hooks/useCurrency';
import useToast from '@/hooks/useToast';
import { MaterialOption } from '@/types/service';
import { Shop } from '@/types/shop';
import { router } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import React, { useState } from 'react';

interface AddServiceToCartButtonProps {
    shop: Shop;
    serviceVariantId: number;
    materialOption: MaterialOption;
    hasMaterialOptions: boolean;
    selectedAddons: Record<number, number>;
    totalPrice: number;
    disabled?: boolean;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'outline';
    openDrawerOnSuccess?: boolean;
    onSuccess?: () => void;
}

const AddServiceToCartButton: React.FC<AddServiceToCartButtonProps> = ({
    shop,
    serviceVariantId,
    materialOption,
    hasMaterialOptions,
    selectedAddons,
    totalPrice,
    disabled = false,
    fullWidth = false,
    size = 'lg',
    variant = 'primary',
    openDrawerOnSuccess = false,
    onSuccess,
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const toast = useToast();
    const cart = useCart();
    const { formatCurrency } = useCurrency(shop);

    const handleAddToCart = () => {
        if (isAdding || disabled) return;

        setIsAdding(true);

        const transformedAddons = Object.entries(selectedAddons)
            .filter(([_, qty]) => qty > 0)
            .map(([addonId, quantity]) => ({
                addon_id: parseInt(addonId),
                quantity: quantity,
            }));

        const data = {
            service_variant_id: serviceVariantId,
            quantity: 1,
            material_option: hasMaterialOptions ? materialOption : null,
            selected_addons: transformedAddons,
        };

        router.post(CartController.storeService.url({ shop: shop.slug }), data, {
            preserveScroll: true,
            only: ['cartSummary', 'cartItemCount', 'cart'],
            onSuccess: () => {
                toast.success('Service added to cart');
                if (openDrawerOnSuccess) {
                    cart.openDrawer();
                }
                onSuccess?.();
            },
            onError: (errors) => {
                const errorMessage =
                    typeof errors === 'object' && errors !== null
                        ? Object.values(errors)[0]
                        : 'Failed to add service to cart';
                toast.error(String(errorMessage));
            },
            onFinish: () => setIsAdding(false),
        });
    };

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            fullWidth={fullWidth}
            disabled={disabled || isAdding}
            loading={isAdding}
            startIcon={<ShoppingCart />}
            onClick={handleAddToCart}
        >
            {isAdding
                ? 'Adding to Cart...'
                : `Book Service - ${formatCurrency(totalPrice)}`}
        </Button>
    );
};

export default AddServiceToCartButton;
