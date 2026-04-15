<?php

namespace App\Http\Requests\Storefront;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProcessCheckoutRequest extends FormRequest
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
            'shipping_address' => ['required', 'array'],
            'shipping_address.first_name' => ['required', 'string', 'max:255'],
            'shipping_address.last_name' => ['required', 'string', 'max:255'],
            'shipping_address.phone' => ['required', 'string', 'max:50'],
            'shipping_address.address_line_1' => ['required', 'string', 'max:255'],
            'shipping_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'shipping_address.city' => ['required', 'string', 'max:100'],
            'shipping_address.state' => ['required', 'string', 'max:100'],
            'shipping_address.postal_code' => ['nullable', 'string', 'max:20'],
            'shipping_address.country' => ['required', 'string', 'max:100'],
            'billing_same_as_shipping' => ['required', 'boolean'],
            'billing_address' => ['required_if:billing_same_as_shipping,false', 'array'],
            'billing_address.first_name' => ['required_if:billing_same_as_shipping,false', 'string', 'max:255'],
            'billing_address.last_name' => ['required_if:billing_same_as_shipping,false', 'string', 'max:255'],
            'billing_address.phone' => ['required_if:billing_same_as_shipping,false', 'string', 'max:50'],
            'billing_address.address_line_1' => ['required_if:billing_same_as_shipping,false', 'string', 'max:255'],
            'billing_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'billing_address.city' => ['required_if:billing_same_as_shipping,false', 'string', 'max:100'],
            'billing_address.state' => ['required_if:billing_same_as_shipping,false', 'string', 'max:100'],
            'billing_address.postal_code' => ['nullable', 'string', 'max:20'],
            'billing_address.country' => ['required_if:billing_same_as_shipping,false', 'string', 'max:100'],
            'payment_method' => ['required', 'string', Rule::in(PaymentMethod::storefrontValues())],
            'idempotency_key' => ['nullable', 'string', 'max:255'],
            'customer_notes' => ['nullable', 'string', 'max:500'],
            'save_addresses' => ['boolean'],
        ];
    }
}
