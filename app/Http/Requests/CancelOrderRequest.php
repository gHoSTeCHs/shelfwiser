<?php

namespace App\Http\Requests;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;

class CancelOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $customer = auth('customer')->user();
        $order = $this->route('order');

        if (! $customer || ! $order instanceof Order) {
            return false;
        }

        return $customer->can('cancel', $order);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cancellation_reason' => ['required', 'string', 'min:10', 'max:500'],
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
            'cancellation_reason.required' => 'Please provide a reason for cancelling this order.',
            'cancellation_reason.min' => 'The cancellation reason must be at least 10 characters.',
            'cancellation_reason.max' => 'The cancellation reason cannot exceed 500 characters.',
        ];
    }
}
