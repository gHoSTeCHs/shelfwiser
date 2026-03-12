<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class RichTextSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'rich_text';
    }

    public function label(): string
    {
        return 'Rich Text';
    }

    public function description(): string
    {
        return 'Editable rich text content block';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::CONTENT;
    }

    public function icon(): string
    {
        return 'document-text';
    }

    public function variants(): array
    {
        return [];
    }

    public function configSchema(): array
    {
        return [
            'content' => [
                'type' => 'rich_text_editor',
                'default' => '',
                'description' => 'Rich text content',
            ],
            'max_width' => [
                'type' => 'select',
                'options' => ['narrow', 'medium', 'wide', 'full'],
                'default' => 'medium',
                'description' => 'Content width',
            ],
            'text_alignment' => [
                'type' => 'select',
                'options' => ['left', 'center', 'right'],
                'default' => 'left',
                'description' => 'Text alignment',
            ],
            'padding' => [
                'type' => 'select',
                'options' => ['none', 'small', 'medium', 'large'],
                'default' => 'medium',
                'description' => 'Vertical padding',
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
