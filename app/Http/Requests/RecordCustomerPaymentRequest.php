<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\Customer;
use App\Models\Shop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class RecordCustomerPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $shop = $this->route('shop');
        $customer = $this->route('customer');

        // Verify shop and customer are valid route model bindings
        if (! $shop instanceof Shop || ! $customer instanceof Customer) {
            return false;
        }

        // Verify shop belongs to user's tenant
        if ($shop->tenant_id !== auth()->user()->tenant_id) {
            return false;
        }

        // Verify customer belongs to user's tenant
        if ($customer->tenant_id !== auth()->user()->tenant_id) {
            return false;
        }

        // Check user has permission to manage customer credit
        return Gate::allows('manage', $customer);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['bail', 'required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'payment_method' => ['bail', 'required', 'string', Rule::enum(PaymentMethod::class)],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'payment_method' => 'payment method',
            'reference_number' => 'reference number',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'Please enter the payment amount.',
            'amount.min' => 'Payment amount must be at least ₦0.01.',
            'payment_method.required' => 'Please select a payment method.',
            'payment_method.in' => 'Please select a valid payment method.',
        ];
    }
}
