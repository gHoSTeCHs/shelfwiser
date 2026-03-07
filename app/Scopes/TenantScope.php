<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (auth('web')->hasUser() && auth('web')->user()->tenant_id) {
            $builder->where($model->getTable().'.tenant_id', auth('web')->user()->tenant_id);
        } elseif (auth('customer')->hasUser() && auth('customer')->user()->tenant_id) {
            $builder->where($model->getTable().'.tenant_id', auth('customer')->user()->tenant_id);
        }
    }
}
