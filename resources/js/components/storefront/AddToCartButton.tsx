import CartController from '@/actions/App/Http/Controllers/Storefront/CartController';
import Button from '@/components/ui/button/Button';
import { Shop } from '@/types/shop';
import { Form } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import React from 'react';

interface AddToCartButtonProps {
    shop: Shop;
    variantId: number;
    quantity: number;
    packagingTypeId?: number | null;
    availableStock: number;
    disabled?: boolean;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'outline';
}

/**
 * Smart add to cart button with validation and loading states.
 * Handles variant selection validation and stock availability checks.
 */
const AddToCartButton: React.FC<AddToCartButtonProps> = ({
    shop,
    variantId,
    quantity,
    packagingTypeId,
    availableStock,
    disabled = false,
    fullWidth = false,
    size = 'md',
    variant = 'primary',
}) => {
    const isOutOfStock = availableStock <= 0;
    const exceedsStock = quantity > availableStock;

    return (
        <Form
            action={CartController.store.url({ shop: shop.slug })}
            method="post"
        >
            {({ processing }) => (
                <>
                    <input type="hidden" name="variant_id" value={variantId} />
                    <input type="hidden" name="quantity" value={quantity} />
                    {packagingTypeId && (
                        <input
                            type="hidden"
                            name="packaging_type_id"
                            value={packagingTypeId}
                        />
                    )}

                    <Button
                        type="submit"
                        variant={variant}
                        size={size}
                        fullWidth={fullWidth}
                        disabled={
                            disabled ||
                            processing ||
                            isOutOfStock ||
                            exceedsStock
                        }
                        loading={processing}
                        startIcon={<ShoppingCart />}
                    >
                        {isOutOfStock
                            ? 'Out of Stock'
                            : exceedsStock
                              ? 'Exceeds Stock'
                              : 'Add to Cart'}
                    </Button>
                </>
            )}
        </Form>
    );
};

export default AddToCartButton;
