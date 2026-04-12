<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class FaqSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'faq';
    }

    public function label(): string
    {
        return 'FAQ';
    }

    public function description(): string
    {
        return 'Frequently asked questions with expandable answers';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::CONTENT;
    }

    public function icon(): string
    {
        return 'question-mark-circle';
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
                'default' => 'Frequently Asked Questions',
                'description' => 'Section heading',
            ],
            'items' => [
                'type' => 'faq_list',
                'default' => [],
                'description' => 'FAQ items (question, answer)',
            ],
            'style' => [
                'type' => 'select',
                'options' => ['accordion', 'list', 'two_column'],
                'default' => 'accordion',
                'description' => 'Display style',
            ],
            'allow_multiple_open' => [
                'type' => 'toggle',
                'default' => false,
                'description' => 'Allow multiple items expanded',
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
            StorefrontPageType::CONTACT,
            StorefrontPageType::CUSTOM,
        ];
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
