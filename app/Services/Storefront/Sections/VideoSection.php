<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class VideoSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'video';
    }

    public function label(): string
    {
        return 'Video';
    }

    public function description(): string
    {
        return 'Embedded video from YouTube or Vimeo';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::MEDIA;
    }

    public function icon(): string
    {
        return 'play-circle';
    }

    public function variants(): array
    {
        return ['embedded', 'background_loop', 'lightbox'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Optional heading',
            ],
            'video_url' => [
                'type' => 'text',
                'default' => '',
                'description' => 'YouTube or Vimeo URL',
            ],
            'thumbnail_image' => [
                'type' => 'image_upload',
                'default' => null,
                'description' => 'Custom thumbnail for lightbox',
            ],
            'aspect_ratio' => [
                'type' => 'select',
                'options' => ['16:9', '4:3', '1:1'],
                'default' => '16:9',
                'description' => 'Video aspect ratio',
            ],
            'autoplay' => [
                'type' => 'toggle',
                'default' => false,
                'description' => 'Autoplay on scroll into view',
            ],
            'max_width' => [
                'type' => 'select',
                'options' => ['medium', 'wide', 'full'],
                'default' => 'wide',
                'description' => 'Container width',
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
        return 2;
    }

    public function minimumAnimationTier(): StorefrontAnimationTier
    {
        return StorefrontAnimationTier::NONE;
    }
}
