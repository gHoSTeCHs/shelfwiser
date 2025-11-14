<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class RequestConnectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', [$this->route('supplierTenant'), $this->route('supplierTenant')]);
    }

    public function rules(): array
    {
        return [
            'buyer_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
