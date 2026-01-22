<?php

namespace App\Http\Requests;

use App\Helpers\CurrencyHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStorefrontSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('manage', $this->route('shop'));
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $supportedCurrencies = array_keys(CurrencyHelper::getSupportedCurrencies());

        return [
            'storefront_enabled' => ['required', 'boolean'],
            'allow_retail_sales' => ['nullable', 'boolean'],

            'currency' => ['required', 'string', 'size:3', Rule::in($supportedCurrencies)],
            'currency_symbol' => ['required', 'string', 'max:10'],
            'currency_decimals' => ['required', 'integer', 'min:0', 'max:4'],

            'vat_enabled' => ['required', 'boolean'],
            'vat_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'vat_inclusive' => ['nullable', 'boolean'],

            'shipping_fee' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],

            'theme_color' => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'logo_url' => ['nullable', 'string', 'max:500', 'url'],
            'banner_url' => ['nullable', 'string', 'max:500', 'url'],

            'meta_title' => ['nullable', 'string', 'max:100'],
            'meta_description' => ['nullable', 'string', 'max:200'],

            'social_facebook' => ['nullable', 'string', 'max:255', 'url'],
            'social_instagram' => ['nullable', 'string', 'max:255', 'url'],
            'social_twitter' => ['nullable', 'string', 'max:255', 'url'],

            'business_hours' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'storefront_enabled.required' => 'Please specify whether the storefront should be enabled.',
            'currency.required' => 'Please select a currency for your storefront.',
            'currency.size' => 'Currency code must be exactly 3 characters (e.g., USD, GBP).',
            'currency.in' => 'The selected currency is not supported.',
            'currency_symbol.required' => 'Please provide a currency symbol.',
            'currency_decimals.required' => 'Please specify the number of decimal places for currency.',
            'currency_decimals.min' => 'Decimal places cannot be negative.',
            'currency_decimals.max' => 'Decimal places cannot exceed 4.',
            'vat_enabled.required' => 'Please specify whether tax (VAT) is enabled.',
            'vat_rate.min' => 'Tax rate cannot be negative.',
            'vat_rate.max' => 'Tax rate cannot exceed 100%.',
            'shipping_fee.min' => 'Shipping fee cannot be negative.',
            'free_shipping_threshold.min' => 'Free shipping threshold cannot be negative.',
            'theme_color.regex' => 'Theme color must be a valid hex color code (e.g., #FF5733).',
            'logo_url.url' => 'Logo URL must be a valid web address.',
            'banner_url.url' => 'Banner URL must be a valid web address.',
            'social_facebook.url' => 'Facebook URL must be a valid web address.',
            'social_instagram.url' => 'Instagram URL must be a valid web address.',
            'social_twitter.url' => 'Twitter URL must be a valid web address.',
            'meta_title.max' => 'Meta title cannot exceed 100 characters.',
            'meta_description.max' => 'Meta description cannot exceed 200 characters.',
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     */
    public function attributes(): array
    {
        return [
            'storefront_enabled' => 'storefront status',
            'allow_retail_sales' => 'retail sales',
            'currency' => 'currency',
            'currency_symbol' => 'currency symbol',
            'currency_decimals' => 'currency decimals',
            'vat_enabled' => 'tax status',
            'vat_rate' => 'tax rate',
            'vat_inclusive' => 'tax inclusive',
            'shipping_fee' => 'shipping fee',
            'free_shipping_threshold' => 'free shipping threshold',
            'theme_color' => 'theme color',
            'logo_url' => 'logo URL',
            'banner_url' => 'banner URL',
            'meta_title' => 'meta title',
            'meta_description' => 'meta description',
            'social_facebook' => 'Facebook URL',
            'social_instagram' => 'Instagram URL',
            'social_twitter' => 'Twitter URL',
            'business_hours' => 'business hours',
        ];
    }
}
