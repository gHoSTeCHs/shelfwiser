<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class ImageWithTextSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'image_with_text';
    }

    public function label(): string
    {
        return 'Image with Text';
    }

    public function description(): string
    {
        return 'Image and text side by side with flexible layouts';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::CONTENT;
    }

    public function icon(): string
    {
        return 'photo';
    }

    public function variants(): array
    {
        return ['side_by_side', 'overlap', 'stacked', 'text_wrap'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Section heading',
            ],
            'text' => [
                'type' => 'rich_text_editor',
                'default' => '',
                'description' => 'Body content',
            ],
            'image' => [
                'type' => 'image_upload',
                'default' => null,
                'description' => 'Section image',
            ],
            'image_position' => [
                'type' => 'select',
                'options' => ['left', 'right'],
                'default' => 'left',
                'description' => 'Image placement',
            ],
            'image_width' => [
                'type' => 'select',
                'options' => ['third', 'half', 'two_thirds'],
                'default' => 'half',
                'description' => 'Image width ratio',
            ],
            'cta_text' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Optional button text',
            ],
            'cta_link' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Button link',
            ],
            'background_color' => [
                'type' => 'color_preset',
                'default' => 'transparent',
                'description' => 'Background color',
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
