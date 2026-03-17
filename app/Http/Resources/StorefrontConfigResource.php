<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontConfigResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'shop_id' => $this->shop_id,
            'theme_id' => $this->theme_id,
            'color_preset' => $this->color_preset,
            'color_overrides' => $this->color_overrides,
            'typography_preset' => $this->typography_preset,
            'typography_overrides' => $this->typography_overrides,
            'component_overrides' => $this->component_overrides,
            'feel_overrides' => $this->feel_overrides,
            'animation_overrides' => $this->animation_overrides,
            'header_overrides' => $this->header_overrides,
            'footer_overrides' => $this->footer_overrides,
            'logo_path' => $this->logo_path,
            'favicon_path' => $this->favicon_path,
            'social_links' => $this->social_links,
            'global_announcement' => $this->global_announcement,
            'seo_defaults' => $this->seo_defaults,
            'is_published' => $this->is_published,
            'published_at' => $this->published_at?->toIso8601String(),
            'theme' => new StorefrontThemeResource($this->whenLoaded('theme')),
            'pages' => StorefrontPageResource::collection($this->whenLoaded('pages')),
        ];
    }
}
