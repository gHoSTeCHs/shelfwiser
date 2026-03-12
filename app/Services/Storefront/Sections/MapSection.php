<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class MapSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'map';
    }

    public function label(): string
    {
        return 'Map';
    }

    public function description(): string
    {
        return 'Embedded map showing shop location';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::CONTENT;
    }

    public function icon(): string
    {
        return 'map-pin';
    }

    public function variants(): array
    {
        return [];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Optional heading',
            ],
            'embed_url' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Google Maps embed URL',
            ],
            'height' => [
                'type' => 'select',
                'options' => ['small', 'medium', 'large'],
                'default' => 'medium',
                'description' => 'Map height (250/400/550px)',
            ],
            'show_address_overlay' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show address card on map',
            ],
        ];
    }

    public function defaultConfig(): array
    {
        return array_map(
            fn (array $field) => $field['default'],
            $this->configSchema(),
        );
    }

    public function resolveData(array $config, Shop $shop): array
    {
        return [
            'address' => $shop->address,
            'city' => $shop->city,
            'state' => $shop->state,
            'country' => $shop->country,
            'name' => $shop->name,
        ];
    }

    public function allowedPageTypes(): array
    {
        return [StorefrontPageType::CONTACT, StorefrontPageType::ABOUT, StorefrontPageType::CUSTOM];
    }

    public function maxPerPage(): int
    {
        return 1;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
