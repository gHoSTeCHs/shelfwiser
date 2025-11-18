<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Shop;
use App\Services\CartService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
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

        Auth::guard('customer')->login($customer, $request->boolean('remember'));

        $sessionId = session()->getId();
        $this->cartService->mergeGuestCartIntoCustomerCart($sessionId, $customer->id, $shop->id);

        $request->session()->regenerate();

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
            'email' => ['required', 'string', 'email', 'max:255', 'unique:customers'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'marketing_opt_in' => ['boolean'],
        ]);

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

        $sessionId = session()->getId();
        $this->cartService->mergeGuestCartIntoCustomerCart($sessionId, $customer->id, $shop->id);

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
}
