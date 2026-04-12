<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class AnnouncementBarSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'announcement_bar';
    }

    public function label(): string
    {
        return 'Announcement Bar';
    }

    public function description(): string
    {
        return 'Top-of-page announcement banner';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::NAVIGATION;
    }

    public function icon(): string
    {
        return 'megaphone';
    }

    public function variants(): array
    {
        return [];
    }

    public function configSchema(): array
    {
        return [
            'text' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Announcement text',
            ],
            'background_color' => [
                'type' => 'color_preset',
                'default' => null,
                'description' => 'Bar background',
            ],
            'text_color' => [
                'type' => 'color_preset',
                'default' => '#ffffff',
                'description' => 'Text color',
            ],
            'link_url' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Optional link URL',
            ],
            'link_text' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Link text',
            ],
            'is_dismissible' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Can visitors close it',
            ],
            'style' => [
                'type' => 'select',
                'options' => ['static', 'scrolling'],
                'default' => 'static',
                'description' => 'Display style',
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
        return 1;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
