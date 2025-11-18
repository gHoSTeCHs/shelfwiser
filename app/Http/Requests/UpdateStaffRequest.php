<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        $staff = $this->route('staff');

        return Gate::allows('update', $staff);
    }

    public function rules(): array
    {
        $staff = $this->route('staff');

        $roles = collect(UserRole::cases())
            ->filter(fn ($role) => $role !== UserRole::OWNER)
            ->map(fn ($role) => $role->value)
            ->toArray();

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users')->where(function ($query) {
                    return $query->where('tenant_id', $this->user()->tenant_id);
                })->ignore($staff->id),
            ],
            'role' => [
                'sometimes',
                'required',
                'string',
                Rule::in($roles),
                function ($attribute, $value, $fail) {
                    $targetRole = UserRole::from($value);
                    if (! Gate::forUser($this->user())->allows('assignRole', [\App\Models\User::class, $targetRole])) {
                        $fail("You don't have permission to assign the {$targetRole->label()} role.");
                    }
                },
            ],
            'shop_ids' => ['sometimes', 'array'],
            'shop_ids.*' => [
                'integer',
                Rule::exists('shops', 'id')->where(function ($query) {
                    $query->where('tenant_id', $this->user()->tenant_id);
                }),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'email.required' => 'Email address is required.',
            'email.unique' => 'This email is already in use within your organization.',
            'role.required' => 'Please select a role for this staff member.',
            'role.in' => 'Invalid role selected.',
            'shop_ids.*.exists' => 'One or more selected shops do not exist or are not accessible.',
        ];
    }
}
