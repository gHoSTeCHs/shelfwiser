<?php

namespace App\Policies;

use App\Models\CustomerAddress;
use App\Models\User;

class CustomerAddressPolicy
{
    public function viewAny(?User $user = null): bool
    {
        if ($user) {
            return $user->role->hasPermission('view_customers');
        }

        $customer = auth('customer')->user();

        return $customer !== null;
    }

    public function view(?User $user, CustomerAddress $address): bool
    {
        if ($user) {
            if ($user->tenant_id !== $address->tenant_id) {
                return false;
            }

            return $user->role->hasPermission('view_customers');
        }

        $customer = auth('customer')->user();
        if ($customer) {
            return $address->customer_id === $customer->id;
        }

        return false;
    }

    public function create(?User $user = null): bool
    {
        if ($user) {
            return $user->role->hasPermission('manage_customers');
        }

        $customer = auth('customer')->user();

        return $customer !== null;
    }

    public function update(?User $user, CustomerAddress $address): bool
    {
        if ($user) {
            if ($user->tenant_id !== $address->tenant_id) {
                return false;
            }

            return $user->role->hasPermission('manage_customers');
        }

        $customer = auth('customer')->user();
        if ($customer) {
            return $address->customer_id === $customer->id;
        }

        return false;
    }

    public function delete(?User $user, CustomerAddress $address): bool
    {
        if ($user) {
            if ($user->tenant_id !== $address->tenant_id) {
                return false;
            }

            return $user->role->hasPermission('manage_customers');
        }

        $customer = auth('customer')->user();
        if ($customer) {
            return $address->customer_id === $customer->id;
        }

        return false;
    }
}
