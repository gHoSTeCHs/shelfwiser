<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StorefrontPageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'page_type' => $this->page_type->value,
            'slug' => $this->slug,
            'title' => $this->title,
            'sections' => collect($this->sections)->map(fn (array $s) => [
                'id' => $s['id'] ?? null,
                'type' => $s['type'] ?? '',
                'variant' => $s['variant'] ?? 'default',
                'is_visible' => $s['is_visible'] ?? true,
                'config' => $s['config'] ?? [],
            ])->values()->all(),
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'is_published' => $this->is_published,
            'sort_order' => $this->sort_order,
        ];
    }
}
