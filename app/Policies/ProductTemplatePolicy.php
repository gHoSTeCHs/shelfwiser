<?php

namespace App\Policies;

use App\Models\ProductTemplate;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProductTemplatePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->role->hasPermission('manage_products')
            || $user->role->hasPermission('create_products');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ProductTemplate $template): bool
    {
        // Can view system templates or own tenant's templates
        if ($template->is_system) {
            return true;
        }

        return $template->tenant_id === $user->tenant_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->role->hasPermission('manage_products');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ProductTemplate $template): bool
    {
        // System templates can only be updated by super admin (handled via route middleware)
        if ($template->is_system) {
            return false;
        }

        return $template->tenant_id === $user->tenant_id
            && $user->role->hasPermission('manage_products');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ProductTemplate $template): bool
    {
        // System templates can only be deleted by super admin (handled via route middleware)
        if ($template->is_system) {
            return false;
        }

        // Cannot delete if template has been used
        if ($template->usage_count > 0) {
            return false;
        }

        return $template->tenant_id === $user->tenant_id
            && $user->role->hasPermission('manage_products');
    }

    /**
     * Determine whether the user can create products from this template.
     */
    public function createProduct(User $user, ProductTemplate $template): bool
    {
        // Can only create products from active templates
        if (! $template->is_active) {
            return false;
        }

        // Must be able to view the template
        if (! $this->view($user, $template)) {
            return false;
        }

        return $user->role->hasPermission('manage_products')
            || $user->role->hasPermission('create_products');
    }

    /**
     * Determine whether the user can save products as templates.
     */
    public function saveAsTemplate(User $user): bool
    {
        return $user->role->hasPermission('manage_products');
    }
}
