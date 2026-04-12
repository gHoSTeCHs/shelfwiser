<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class TestimonialsSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'testimonials';
    }

    public function label(): string
    {
        return 'Testimonials';
    }

    public function description(): string
    {
        return 'Customer testimonials with ratings and avatars';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::SOCIAL_PROOF;
    }

    public function icon(): string
    {
        return 'chat-bubble-left-right';
    }

    public function variants(): array
    {
        return ['carousel', 'grid', 'masonry', 'single_spotlight', 'marquee'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'What Our Customers Say',
                'description' => 'Section heading',
            ],
            'items' => [
                'type' => 'testimonial_list',
                'default' => [],
                'description' => 'Testimonial items (name, text, rating, avatar_path, location)',
            ],
            'auto_rotate' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Auto-rotate for carousel/spotlight',
            ],
            'rotate_interval' => [
                'type' => 'number',
                'default' => 5,
                'description' => 'Seconds between slides (3-10)',
            ],
            'show_rating' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show star ratings',
            ],
            'columns' => [
                'type' => 'select',
                'options' => [2, 3],
                'default' => 3,
                'description' => 'Columns for grid layout',
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
        return [
            StorefrontPageType::HOME,
            StorefrontPageType::ABOUT,
            StorefrontPageType::CUSTOM,
        ];
    }

    public function maxPerPage(): int
    {
        return 2;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
