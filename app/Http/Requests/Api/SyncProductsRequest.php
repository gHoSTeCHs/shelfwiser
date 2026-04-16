<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncProductsRequest extends FormRequest
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
        $tenantId = $this->user()->tenant_id;

        return [
            'shop_id' => [
                'required',
                'integer',
                Rule::exists('shops', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'updated_since' => ['nullable', 'date'],
        ];
    }
}
