<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexCreditCustomersRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', Rule::in(['balance_high', 'balance_low', 'limit_high', 'limit_low'])],
        ];
    }

    /**
     * @return array{search: ?string, sort: ?string}
     */
    public function filters(): array
    {
        return [
            'search' => $this->validated('search'),
            'sort' => $this->validated('sort'),
        ];
    }
}
