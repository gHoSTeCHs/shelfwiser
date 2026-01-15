<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Validator;

class RequestConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', [$this->route('supplierTenant'), $this->route('supplierTenant')]);
    }

    public function rules(): array
    {
        return [
            'buyer_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $supplierTenant = $this->route('supplierTenant');

            if (! $supplierTenant) {
                $validator->errors()->add('supplier', 'Supplier tenant not found.');

                return;
            }

            if (! $supplierTenant->isSupplier()) {
                $validator->errors()->add('supplier', 'This business is not operating as a supplier.');
            }

            if ($supplierTenant->supplierProfile && ! $supplierTenant->supplierProfile->is_enabled) {
                $validator->errors()->add('supplier', 'This supplier is not currently accepting new connections.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'buyer_notes.max' => 'Notes cannot exceed 1000 characters.',
        ];
    }
}
