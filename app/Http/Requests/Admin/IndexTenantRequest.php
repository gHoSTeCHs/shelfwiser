<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'plan' => ['nullable', 'string', Rule::in(['trial', 'basic', 'professional', 'enterprise'])],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array{search: ?string, plan: ?string, is_active: ?bool}
     */
    public function filters(): array
    {
        return [
            'search' => $this->input('search'),
            'plan' => $this->input('plan'),
            'is_active' => $this->has('is_active') ? $this->boolean('is_active') : null,
        ];
    }
}
