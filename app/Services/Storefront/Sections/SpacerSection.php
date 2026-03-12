<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class SpacerSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'spacer';
    }

    public function label(): string
    {
        return 'Spacer';
    }

    public function description(): string
    {
        return 'Vertical spacing with optional divider line';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::LAYOUT;
    }

    public function icon(): string
    {
        return 'arrows-expand';
    }

    public function variants(): array
    {
        return [];
    }

    public function configSchema(): array
    {
        return [
            'height' => [
                'type' => 'select',
                'options' => ['small', 'medium', 'large', 'xlarge'],
                'default' => 'medium',
                'description' => 'Spacer height',
            ],
            'show_divider' => [
                'type' => 'toggle',
                'default' => false,
                'description' => 'Show horizontal line',
            ],
            'divider_style' => [
                'type' => 'select',
                'options' => ['solid', 'dashed', 'dotted'],
                'default' => 'solid',
                'description' => 'Divider line style',
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
        return [];
    }

    public function allowedPageTypes(): array
    {
        return StorefrontPageType::cases();
    }

    public function maxPerPage(): int
    {
        return 0;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
