<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStorefrontConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'color_preset' => ['nullable', 'string', 'max:50'],
            'color_overrides' => ['nullable', 'array', 'max:50'],
            'color_overrides.*' => ['string', 'max:100', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
            'typography_preset' => ['nullable', 'string', 'max:50'],
            'typography_overrides' => ['nullable', 'array', 'max:20'],
            'typography_overrides.*' => ['string', 'max:200'],
            'component_overrides' => ['nullable', 'array', 'max:50'],
            'feel_overrides' => ['nullable', 'array', 'max:20'],
            'feel_overrides.*' => ['string', 'max:100'],
            'animation_overrides' => ['nullable', 'array', 'max:20'],
            'header_overrides' => ['nullable', 'array', 'max:30'],
            'footer_overrides' => ['nullable', 'array', 'max:30'],
            'global_announcement' => ['nullable', 'array'],
            'global_announcement.text' => ['nullable', 'string', 'max:500'],
            'global_announcement.enabled' => ['nullable', 'boolean'],
            'social_links' => ['nullable', 'array', 'max:20'],
            'social_links.*' => ['nullable', 'string', 'max:500'],
            'seo_defaults' => ['nullable', 'array'],
            'seo_defaults.title' => ['nullable', 'string', 'max:255'],
            'seo_defaults.description' => ['nullable', 'string', 'max:500'],
            'dark_mode_enabled' => ['sometimes', 'boolean'],
            'dark_mode_strategy' => ['sometimes', 'string', 'in:system,toggle,light,dark'],
            'color_preset_dark' => ['sometimes', 'nullable', 'string', 'max:100'],
            'color_overrides_dark' => ['sometimes', 'nullable', 'array', 'max:50'],
            'color_overrides_dark.*' => ['string', 'max:50', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
        ];
    }
}
