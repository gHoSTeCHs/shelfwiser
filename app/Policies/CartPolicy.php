<?php

namespace App\Policies;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;

class CartPolicy
{
    /**
     * Determine whether the customer can view the cart.
     */
    public function view(Customer $customer, Cart $cart): bool
    {
        return $cart->customer_id === $customer->id
            && $cart->tenant_id === $customer->tenant_id;
    }

    /**
     * Determine whether the customer can update the cart.
     */
    public function update(Customer $customer, Cart $cart): bool
    {
        return $cart->customer_id === $customer->id
            && $cart->tenant_id === $customer->tenant_id;
    }

    /**
     * Determine whether the customer can delete the cart.
     */
    public function delete(Customer $customer, Cart $cart): bool
    {
        return $cart->customer_id === $customer->id
            && $cart->tenant_id === $customer->tenant_id;
    }

    /**
     * Determine whether the customer can manage the cart item.
     */
    public function manageItem(Customer $customer, CartItem $item): bool
    {
        $cart = $item->cart;

        return $cart->customer_id === $customer->id
            && $cart->tenant_id === $customer->tenant_id;
    }
}
