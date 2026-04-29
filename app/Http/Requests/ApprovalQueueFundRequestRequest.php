<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApprovalQueueFundRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['nullable', 'integer', Rule::exists('shops', 'id')->where('tenant_id', $this->user()->tenant_id)],
        ];
    }

    public function shopId(): ?int
    {
        return $this->validated('shop_id') ? (int) $this->validated('shop_id') : null;
    }
}
