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
