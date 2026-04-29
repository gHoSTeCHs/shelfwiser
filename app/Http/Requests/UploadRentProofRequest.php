<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadRentProofRequest extends FormRequest
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
            'rent_proof_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'rent_proof_expiry' => ['nullable', 'date', 'after:today'],
        ];
    }
}
