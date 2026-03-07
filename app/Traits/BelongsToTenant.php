<?php

namespace App\Traits;

use App\Scopes\TenantScope;

trait BelongsToTenant
{
    /**
     * Boot the BelongsToTenant trait for a model.
     */
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            if (auth('web')->hasUser() && ! $model->tenant_id) {
                $model->tenant_id = auth('web')->user()->tenant_id;
            } elseif (auth('customer')->hasUser() && ! $model->tenant_id) {
                $model->tenant_id = auth('customer')->user()->tenant_id;
            }
        });
    }
}
