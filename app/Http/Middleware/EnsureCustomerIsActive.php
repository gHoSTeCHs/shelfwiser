<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerIsActive
{
    /**
     * Handle an incoming request.
     *
     * Verifies that the authenticated customer's account is active.
     * Aborts with 403 if the customer has been deactivated since they last logged in.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $customer = auth('customer')->user();

        if ($customer && ! $customer->is_active) {
            abort(403, 'Your account has been deactivated. Please contact the shop for assistance.');
        }

        return $next($request);
    }
}
