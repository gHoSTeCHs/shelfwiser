<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class NewsletterSignupSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'newsletter_signup';
    }

    public function label(): string
    {
        return 'Newsletter Signup';
    }

    public function description(): string
    {
        return 'Email newsletter signup form';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::COMMERCE;
    }

    public function icon(): string
    {
        return 'envelope';
    }

    public function variants(): array
    {
        return ['inline', 'stacked', 'split', 'popup_trigger'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'Stay Updated',
                'description' => 'Section heading',
            ],
            'subheading' => [
                'type' => 'text',
                'default' => 'Subscribe for offers and updates',
                'description' => 'Subtext',
            ],
            'placeholder' => [
                'type' => 'text',
                'default' => 'Enter your email',
                'description' => 'Input placeholder',
            ],
            'button_text' => [
                'type' => 'text',
                'default' => 'Subscribe',
                'description' => 'Submit button text',
            ],
            'background_color' => [
                'type' => 'color_preset',
                'default' => null,
                'description' => 'Background color',
            ],
            'success_message' => [
                'type' => 'text',
                'default' => 'Thanks for subscribing!',
                'description' => 'Post-submit message',
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
