<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontThemeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->category?->value,
            'thumbnail_path' => $this->thumbnail_path,
            'ideal_for' => $this->ideal_for,
            'theme_config' => $this->theme_config,
            'default_sections' => $this->default_sections,
            'is_premium' => $this->is_premium,
            'template' => new StorefrontTemplateResource($this->whenLoaded('template')),
        ];
    }
}
