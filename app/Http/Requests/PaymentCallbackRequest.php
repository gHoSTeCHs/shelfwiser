<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentCallbackRequest extends FormRequest
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
            'reference' => ['nullable', 'string', 'max:255'],
            'tx_ref' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function reference(): ?string
    {
        return $this->input('reference') ?? $this->input('tx_ref');
    }
}
