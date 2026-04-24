<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveOrderReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'restock_items' => ['sometimes', 'boolean'],
            'process_refund' => ['sometimes', 'boolean'],
        ];
    }
}
