<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class HeroBannerSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'hero_banner';
    }

    public function label(): string
    {
        return 'Hero Banner';
    }

    public function description(): string
    {
        return 'Full-width hero banner with headline, subtext, and call-to-action buttons';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::HERO;
    }

    public function icon(): string
    {
        return 'photo';
    }

    public function variants(): array
    {
        return ['centered_overlay', 'split_image', 'slideshow', 'minimal_text', 'video_background', 'asymmetric'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'Welcome to Our Store',
                'description' => 'Main heading',
            ],
            'subheading' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Secondary text',
            ],
            'background_type' => [
                'type' => 'select',
                'options' => ['image', 'color', 'gradient', 'video'],
                'default' => 'image',
                'description' => 'Background style',
            ],
            'background_image' => [
                'type' => 'image_upload',
                'default' => null,
                'description' => 'Background image',
            ],
            'background_video_url' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Video URL for video variant',
            ],
            'background_color' => [
                'type' => 'color_preset',
                'default' => null,
                'description' => 'Solid background',
            ],
            'gradient_from' => [
                'type' => 'color_preset',
                'default' => null,
                'description' => 'Gradient start',
            ],
            'gradient_to' => [
                'type' => 'color_preset',
                'default' => null,
                'description' => 'Gradient end',
            ],
            'background_overlay' => [
                'type' => 'slider',
                'default' => 0.4,
                'description' => 'Overlay opacity (0-1)',
            ],
            'cta_text' => [
                'type' => 'text',
                'default' => 'Shop Now',
                'description' => 'Primary button text',
            ],
            'cta_link' => [
                'type' => 'text',
                'default' => '/products',
                'description' => 'Primary button link',
            ],
            'cta_secondary_text' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Optional second button',
            ],
            'cta_secondary_link' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Second button link',
            ],
            'height' => [
                'type' => 'select',
                'options' => ['small', 'medium', 'large', 'full'],
                'default' => 'large',
                'description' => 'Section height',
            ],
            'text_alignment' => [
                'type' => 'select',
                'options' => ['left', 'center', 'right'],
                'default' => 'center',
                'description' => 'Text alignment',
            ],
            'text_color' => [
                'type' => 'color_preset',
                'default' => '#ffffff',
                'description' => 'Text color',
            ],
            'show_scroll_indicator' => [
                'type' => 'toggle',
                'default' => false,
                'description' => 'Down arrow hint',
            ],
            'slides' => [
                'type' => 'slide_list',
                'default' => [],
                'description' => 'Slideshow slides',
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
        return StorefrontAnimationTier::SUBTLE;
    }
}
