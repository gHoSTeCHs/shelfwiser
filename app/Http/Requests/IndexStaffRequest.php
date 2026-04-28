<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'role' => ['nullable', 'string', Rule::enum(UserRole::class)],
            'shop_id' => ['nullable', 'integer', Rule::exists('shops', 'id')->where('tenant_id', $tenantId)],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
