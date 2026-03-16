<?php

namespace App\Http\Requests\Storefront;

use App\Enums\MaterialOption;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddServiceToCartApiRequest extends FormRequest
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
        $tenantId = $this->route('shop')->tenant_id;

        return [
            'service_variant_id' => [
                'required',
                'integer',
                Rule::exists('service_variants', 'id')->where(function ($query) use ($tenantId) {
                    $query->whereIn('service_id', function ($sub) use ($tenantId) {
                        $sub->select('id')->from('services')->where('tenant_id', $tenantId);
                    });
                }),
            ],
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'material_option' => ['nullable', 'string', Rule::in(array_column(MaterialOption::cases(), 'value'))],
            'selected_addons' => ['nullable', 'array'],
            'selected_addons.*.addon_id' => [
                'required',
                'integer',
                Rule::exists('service_addons', 'id')->where(function ($query) use ($tenantId) {
                    $query->whereIn('service_id', function ($sub) use ($tenantId) {
                        $sub->select('id')->from('services')->where('tenant_id', $tenantId);
                    });
                }),
            ],
            'selected_addons.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
