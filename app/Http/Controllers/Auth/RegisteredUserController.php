<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TenantService;
use Exception;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(private readonly TenantService $tenantService) {}

    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'fname' => 'required|string|max:255',
            'lname' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'company_name' => 'required|string|max:255',
        ]);

        try {
            $result = $this->tenantService->createTenant(
                [
                    'name' => $request->company_name,
                    'email' => $request->email,

                ],
                [
                    'first_name' => $request->fname,
                    'last_name' => $request->lname,
                    'email' => $request->email,
                    'password' => $request->password,
                ]
            );

            event(new Registered($result['owner']));

            Auth::login($result['owner']);

            $request->session()->regenerate();

            return redirect()->intended(route('dashboard', absolute: false));

        } catch (Exception $e) {
            Log::error('Registration failed', ['exception' => $e]);

            return back()->withErrors([
                'email' => 'Registration failed. Please try again.',
            ])->withInput();
        }
    }
}
