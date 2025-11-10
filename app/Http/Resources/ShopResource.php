<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => [
                'slug' => $this->type->slug,
                'label' => $this->type->label,
                'description' => $this->type->description,
            ],
            'config' => $this->config,
            'is_active' => $this->is_active,
            'users_count' => $this->whenLoaded('users', fn() => $this->users->count()),
            'can_manage' => $request->user()->can('manage', $this->resource),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
