<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DisburseWageAdvanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'repayment_start_date' => ['nullable', 'date', 'after:today'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
