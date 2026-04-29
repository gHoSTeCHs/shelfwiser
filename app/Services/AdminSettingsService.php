<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminSettingsService
{
    public function getSystemSettings(): array
    {
        $stored = DB::table('system_settings')->pluck('value', 'key');

        return [
            'app_name' => $stored->get('app_name', config('app.name')),
            'app_url' => config('app.url'),
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'maintenance_mode' => app()->isDownForMaintenance(),
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
            'mail_driver' => config('mail.default'),
            'timezone' => $stored->get('timezone', config('app.timezone')),
            'locale' => $stored->get('locale', config('app.locale')),
        ];
    }

    public function updateSystemSettings(array $data): void
    {
        $allowed = ['app_name', 'timezone', 'locale'];

        foreach (array_intersect_key($data, array_flip($allowed)) as $key => $value) {
            if ($value === null) {
                DB::table('system_settings')->where('key', $key)->delete();
            } else {
                DB::table('system_settings')->upsert(
                    [['key' => $key, 'value' => $value, 'created_at' => now(), 'updated_at' => now()]],
                    ['key'],
                    ['value', 'updated_at']
                );
            }
        }
    }

    public function getSystemStats(): array
    {
        return [
            'total_tenants' => Tenant::count(),
            'total_users' => User::count(),
            'total_products' => Product::count(),
            'total_orders' => Order::count(),
            'cache_size' => $this->getCacheSize(),
            'storage_used' => $this->getStorageSize(),
        ];
    }

    public function clearCache(): void
    {
        Cache::flush();
    }

    protected function getCacheSize(): string
    {
        return '0 MB';
    }

    protected function getStorageSize(): string
    {
        $storagePath = storage_path('app');
        $size = 0;

        if (is_dir($storagePath)) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($storagePath)) as $file) {
                $size += $file->getSize();
            }
        }

        return number_format($size / 1024 / 1024, 2).' MB';
    }
}
