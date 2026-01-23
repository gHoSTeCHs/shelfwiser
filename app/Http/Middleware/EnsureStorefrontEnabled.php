<?php

namespace App\Http\Middleware;

use App\Models\Shop;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStorefrontEnabled
{
    /**
     * Handle an incoming request.
     *
     * Verifies that the shop's storefront is enabled.
     * Aborts with 404 if the storefront is not available.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $shop = $request->route('shop');

        if ($shop instanceof Shop && !$shop->storefront_enabled) {
            abort(404, 'Storefront not available for this shop');
        }

        return $next($request);
    }
}
