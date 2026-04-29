<?php

namespace App\Http\Requests;

use App\Enums\FundRequestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFundRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['required', Rule::exists('shops', 'id')->where('tenant_id', $this->user()->tenant_id)],
            'request_type' => ['required', Rule::enum(FundRequestType::class)],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:1000'],
        ];
    }
}
