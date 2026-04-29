<?php

namespace App\Http\Requests;

use App\DTOs\DateRange;
use App\Enums\FundRequestStatus;
use App\Enums\FundRequestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexFundRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['nullable', 'integer', Rule::exists('shops', 'id')->where('tenant_id', $this->user()->tenant_id)],
            'status' => ['nullable', Rule::enum(FundRequestStatus::class)],
            'type' => ['nullable', Rule::enum(FundRequestType::class)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }

    public function shopId(): ?int
    {
        return $this->validated('shop_id') ? (int) $this->validated('shop_id') : null;
    }

    public function status(): ?FundRequestStatus
    {
        $value = $this->validated('status');

        return $value ? FundRequestStatus::from($value) : null;
    }

    public function type(): ?FundRequestType
    {
        $value = $this->validated('type');

        return $value ? FundRequestType::from($value) : null;
    }

    public function dateRange(): DateRange
    {
        return DateRange::fromRequest($this->validated(), 'start_date', 'end_date');
    }
}
