<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Shop;
use App\Services\CartService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    /**
     * Display customer login form.
     */
    public function showLogin(Shop $shop): Response
    {
        return Inertia::render('Storefront/Auth/Login', [
            'shop' => $shop,
        ]);
    }

    /**
     * Handle customer login request.
     */
    public function login(Request $request, Shop $shop): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $customer = Customer::where('email', $request->email)
            ->where('tenant_id', $shop->tenant_id)
            ->where('is_active', true)
            ->first();

        if (! $customer || ! Hash::check($request->password, $customer->password)) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->onlyInput('email');
        }

        $oldSessionId = session()->getId();

        Auth::guard('customer')->login($customer, $request->boolean('remember'));

        $request->session()->regenerate();

        $this->cartService->mergeGuestCartIntoCustomerCart($oldSessionId, $customer->id, $shop->id);

        return redirect()->intended(route('storefront.index', $shop->slug));
    }

    /**
     * Display customer registration form.
     */
    public function showRegister(Shop $shop): Response
    {
        return Inertia::render('Storefront/Auth/Register', [
            'shop' => $shop,
        ]);
    }

    /**
     * Handle customer registration request.
     */
    public function register(Request $request, Shop $shop): RedirectResponse
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('customers')->where('tenant_id', $shop->tenant_id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'marketing_opt_in' => ['boolean'],
        ]);

        $oldSessionId = session()->getId();

        $customer = Customer::create([
            'tenant_id' => $shop->tenant_id,
            'preferred_shop_id' => $shop->id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'marketing_opt_in' => $request->boolean('marketing_opt_in'),
        ]);

        event(new Registered($customer));

        Auth::guard('customer')->login($customer);

        $request->session()->regenerate();

        $this->cartService->mergeGuestCartIntoCustomerCart($oldSessionId, $customer->id, $shop->id);

        return redirect()->route('storefront.index', $shop->slug);
    }

    /**
     * Handle customer logout request.
     */
    public function logout(Request $request, Shop $shop): RedirectResponse
    {
        Auth::guard('customer')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('storefront.index', $shop->slug);
    }

    /**
     * Display email verification notice.
     */
    public function showVerificationNotice(Shop $shop): Response|RedirectResponse
    {
        $customer = Auth::guard('customer')->user();

        if ($customer && $customer->hasVerifiedEmail()) {
            return redirect()->route('storefront.index', $shop->slug);
        }

        return Inertia::render('Storefront/Auth/VerifyEmail', [
            'shop' => $shop,
        ]);
    }

    /**
     * Handle email verification.
     */
    public function verifyEmail(Request $request, Shop $shop, string $id, string $hash): RedirectResponse
    {
        $customer = Customer::where('id', $id)
            ->where('tenant_id', $shop->tenant_id)
            ->firstOrFail();

        if (! hash_equals((string) $hash, sha1($customer->getEmailForVerification()))) {
            throw ValidationException::withMessages([
                'email' => ['The verification link is invalid.'],
            ]);
        }

        if ($customer->hasVerifiedEmail()) {
            return redirect()->route('storefront.index', $shop->slug);
        }

        if ($customer->markEmailAsVerified()) {
            event(new Verified($customer));
        }

        $oldSessionId = session()->getId();

        Auth::guard('customer')->login($customer);

        $request->session()->regenerate();

        $this->cartService->mergeGuestCartIntoCustomerCart($oldSessionId, $customer->id, $shop->id);

        return redirect()->route('storefront.index', $shop->slug)
            ->with('status', 'Your email has been verified!');
    }

    /**
     * Resend email verification notification.
     */
    public function resendVerificationEmail(Request $request, Shop $shop): RedirectResponse
    {
        $customer = Auth::guard('customer')->user();

        if ($customer && $customer->hasVerifiedEmail()) {
            return redirect()->route('storefront.index', $shop->slug);
        }

        if ($customer) {
            $customer->sendEmailVerificationNotification();
        }

        return back()->with('status', 'Verification email sent!');
    }

    /**
     * Display forgot password form.
     */
    public function showForgotPassword(Shop $shop): Response
    {
        return Inertia::render('Storefront/Auth/ForgotPassword', [
            'shop' => $shop,
        ]);
    }

    /**
     * Send password reset link.
     */
    public function sendResetLink(Request $request, Shop $shop): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $customer = Customer::where('email', $request->email)
            ->where('tenant_id', $shop->tenant_id)
            ->first();

        if (! $customer) {
            return back()->withErrors([
                'email' => 'We could not find a customer with that email address.',
            ]);
        }

        $status = Password::broker('customers')->sendResetLink(
            ['email' => $request->email]
        );

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    /**
     * Display password reset form.
     */
    public function showResetPassword(Shop $shop, string $token): Response
    {
        return Inertia::render('Storefront/Auth/ResetPassword', [
            'shop' => $shop,
            'token' => $token,
            'email' => request('email'),
        ]);
    }

    /**
     * Handle password reset.
     */
    public function resetPassword(Request $request, Shop $shop): RedirectResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $customer = Customer::where('email', $request->email)
            ->where('tenant_id', $shop->tenant_id)
            ->first();

        if (! $customer) {
            throw ValidationException::withMessages([
                'email' => ['We could not find a customer with that email address.'],
            ]);
        }

        $status = Password::broker('customers')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (Customer $customer, string $password) {
                $customer->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $customer->save();

                event(new PasswordReset($customer));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route('storefront.login', $shop->slug)
                ->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }
}
