<?php

namespace App\Services\Storefront\Sections;

use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

class ContactFormSection implements StorefrontSectionInterface
{
    public function type(): string
    {
        return 'contact_form';
    }

    public function label(): string
    {
        return 'Contact Form';
    }

    public function description(): string
    {
        return 'Contact form with optional shop contact details';
    }

    public function category(): SectionCategory
    {
        return SectionCategory::CONTENT;
    }

    public function icon(): string
    {
        return 'envelope';
    }

    public function variants(): array
    {
        return ['side_by_side', 'stacked', 'form_only', 'card_grid'];
    }

    public function configSchema(): array
    {
        return [
            'heading' => [
                'type' => 'text',
                'default' => 'Get In Touch',
                'description' => 'Section heading',
            ],
            'subheading' => [
                'type' => 'text',
                'default' => '',
                'description' => 'Subtext',
            ],
            'show_phone' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show phone number',
            ],
            'show_email' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show email address',
            ],
            'show_address' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show physical address',
            ],
            'show_form' => [
                'type' => 'toggle',
                'default' => true,
                'description' => 'Show contact form',
            ],
            'form_fields' => [
                'type' => 'select',
                'options' => ['basic', 'detailed'],
                'default' => 'basic',
                'description' => 'Form complexity (basic: name, email, message)',
            ],
            'success_message' => [
                'type' => 'text',
                'default' => "Thanks! We'll get back to you soon.",
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
        return [
            'phone' => $shop->phone,
            'email' => $shop->email,
            'address' => $shop->address,
            'city' => $shop->city,
            'state' => $shop->state,
            'country' => $shop->country,
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
