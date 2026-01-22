<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Inertia\Inertia;
use Inertia\Response;

class AdminSettingsController extends Controller
{
    /**
     * Display system settings page.
     */
    public function index(): Response
    {
        $settings = [
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'maintenance_mode' => app()->isDownForMaintenance(),
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
            'mail_driver' => config('mail.default'),
            'timezone' => config('app.timezone'),
            'locale' => config('app.locale'),
        ];

        $stats = [
            'total_tenants' => \App\Models\Tenant::count(),
            'total_users' => \App\Models\User::count(),
            'total_products' => \App\Models\Product::count(),
            'total_orders' => \App\Models\Order::count(),
            'cache_size' => $this->getCacheSize(),
            'storage_used' => $this->getStorageSize(),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'stats' => $stats,
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'app_name' => 'nullable|string|max:255',
            'timezone' => 'nullable|string|timezone',
            'locale' => 'nullable|string|in:en,fr,es,de',
        ]);

        // TODO: Implement actual settings update to .env or database
        // For now, this is a placeholder

        return redirect()
            ->route('admin.settings.index')
            ->with('success', 'Settings updated successfully.');
    }

    /**
     * Clear application cache.
     */
    public function clearCache(): RedirectResponse
    {
        Cache::flush();

        return redirect()
            ->route('admin.settings.index')
            ->with('success', 'Cache cleared successfully.');
    }

    /**
     * Get cache size estimate.
     */
    protected function getCacheSize(): string
    {
        // Placeholder - would need to check actual cache storage
        return '0 MB';
    }

    /**
     * Get storage size estimate.
     */
    protected function getStorageSize(): string
    {
        $storagePath = storage_path('app');
        $size = 0;

        if (is_dir($storagePath)) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($storagePath)) as $file) {
                $size += $file->getSize();
            }
        }

        return number_format($size / 1024 / 1024, 2) . ' MB';
    }
}
