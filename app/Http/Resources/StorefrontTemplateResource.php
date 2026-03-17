<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->category?->value,
            'animation_tier' => $this->animation_tier?->value,
            'structural_config' => $this->structural_config,
            'supported_sections' => $this->supported_sections,
            'supported_pages' => $this->supported_pages,
        ];
    }
}
