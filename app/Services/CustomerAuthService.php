<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Shop;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerAuthService
{
    /**
     * Verify credentials and return the matching customer, or null on failure.
     * Combines lookup + password check so controllers never touch Hash directly.
     * The tenant filter is a legitimate pre-auth exception — the customer guard
     * is not yet active so TenantScope does not apply.
     */
    public function attemptLogin(string $email, string $password, int $tenantId): ?Customer
    {
        $customer = Customer::query()
            ->where('email', $email)
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->first();

        if (! $customer || ! Hash::check($password, $customer->password)) {
            return null;
        }

        return $customer;
    }

    /**
     * Find a customer for email verification and validate the signed hash.
     *
     * @throws ValidationException if the hash does not match
     */
    public function findForEmailVerification(string $id, int $tenantId, string $hash): Customer
    {
        $customer = Customer::query()
            ->where('id', $id)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        if (! hash_equals((string) $hash, sha1($customer->getEmailForVerification()))) {
            throw ValidationException::withMessages([
                'email' => ['The verification link is invalid.'],
            ]);
        }

        return $customer;
    }

    /**
     * Create a new customer account for the given shop and fire the Registered event.
     */
    public function register(Shop $shop, array $validated): Customer
    {
        $customer = Customer::query()->create([
            'tenant_id' => $shop->tenant_id,
            'preferred_shop_id' => $shop->id,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'marketing_opt_in' => (bool) ($validated['marketing_opt_in'] ?? false),
        ]);

        event(new Registered($customer));

        return $customer;
    }

    /**
     * Reset a customer's password via the customers broker and return the status string.
     */
    public function resetPassword(array $credentials): string
    {
        return Password::broker('customers')->reset(
            $credentials,
            function (Customer $customer, string $password) {
                $customer->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $customer->save();

                event(new PasswordReset($customer));
            }
        );
    }
}
