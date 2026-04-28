<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WageAdvanceApprovalQueueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['nullable', 'integer', 'exists:shops,id'],
        ];
    }
}
