<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterUserRequest;
use App\Services\TenantService;
use Exception;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

    public function store(RegisterUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $result = $this->tenantService->createTenant(
                [
                    'name' => $validated['company_name'],
                    'email' => $validated['email'],
                ],
                [
                    'first_name' => $validated['fname'],
                    'last_name' => $validated['lname'],
                    'email' => $validated['email'],
                    'password' => $validated['password'],
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
