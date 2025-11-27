<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class CreateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', \App\Models\User::class);
    }

    public function rules(): array
    {
        $roles = collect(UserRole::cases())
            ->filter(fn ($role) => $role !== UserRole::OWNER)
            ->map(fn ($role) => $role->value)
            ->toArray();

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->where(function ($query) {
                    return $query->where('tenant_id', $this->user()->tenant_id);
                }),
            ],
            'role' => [
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
            'shop_ids' => ['nullable', 'array'],
            'shop_ids.*' => [
                'integer',
                Rule::exists('shops', 'id')->where(function ($query) {
                    $query->where('tenant_id', $this->user()->tenant_id);
                }),
            ],
            'password' => ['required', Password::defaults()],
            'send_invitation' => ['boolean'],
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
            'password.required' => 'Password is required.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'send_invitation' => $this->boolean('send_invitation', false),
        ]);
    }
}
