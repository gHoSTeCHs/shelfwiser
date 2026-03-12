<?php

namespace App\Services\Storefront;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontTemplate;

class SectionTypeRegistry
{
    /** @var array<string, StorefrontSectionInterface> */
    private array $types = [];

    public function register(StorefrontSectionInterface $section): void
    {
        $this->types[$section->type()] = $section;
    }

    public function get(string $type): ?StorefrontSectionInterface
    {
        return $this->types[$type] ?? null;
    }

    /** @return array<string, StorefrontSectionInterface> */
    public function all(): array
    {
        return $this->types;
    }

    /** @return array<string, list<StorefrontSectionInterface>> */
    public function byCategory(): array
    {
        $grouped = [];

        foreach ($this->types as $section) {
            $grouped[$section->category()->value][] = $section;
        }

        return $grouped;
    }

    /** @return list<StorefrontSectionInterface> */
    public function forPageType(StorefrontPageType $pageType): array
    {
        return array_values(array_filter(
            $this->types,
            fn (StorefrontSectionInterface $section) => in_array($pageType, $section->allowedPageTypes()),
        ));
    }

    /** @return list<StorefrontSectionInterface> */
    public function forTemplate(StorefrontTemplate $template): array
    {
        $supported = $template->supported_sections ?? [];

        if (empty($supported)) {
            return array_values($this->types);
        }

        return array_values(array_filter(
            $this->types,
            fn (StorefrontSectionInterface $section) => in_array($section->type(), $supported),
        ));
    }

    public function resolveData(string $type, array $config, Shop $shop): array
    {
        $section = $this->get($type);

        if (! $section) {
            return [];
        }

        return $section->resolveData($config, $shop);
    }

    /** @return array<string, array{type: string, label: string, description: string, category: string, icon: string, variants: array, config_schema: array, default_config: array, max_per_page: int, min_animation_tier: string}> */
    public function getBuilderManifest(StorefrontTemplate $template): array
    {
        $sections = $this->forTemplate($template);
        $manifest = [];

        foreach ($sections as $section) {
            $manifest[$section->type()] = [
                'type' => $section->type(),
                'label' => $section->label(),
                'description' => $section->description(),
                'category' => $section->category()->value,
                'icon' => $section->icon(),
                'variants' => $section->variants(),
                'config_schema' => $section->configSchema(),
                'default_config' => $section->defaultConfig(),
                'max_per_page' => $section->maxPerPage(),
                'min_animation_tier' => $section->minimumAnimationTier()->value,
            ];
        }

        return $manifest;
    }
}
