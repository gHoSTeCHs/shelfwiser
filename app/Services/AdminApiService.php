<?php

namespace App\Services;

class AdminApiService
{
    public function getApiKeys(): array
    {
        return [];
    }

    public function getStats(): array
    {
        return [
            'total_api_keys' => 0,
            'active_keys' => 0,
            'total_requests_today' => 0,
            'total_requests_month' => 0,
        ];
    }

    public function getRateLimits(): array
    {
        return [
            'default' => '60 requests per minute',
            'authenticated' => '1000 requests per hour',
        ];
    }

    public function createApiKey(array $validated): void
    {
        // API key creation not yet implemented
    }

    public function revokeApiKey(string $id): void
    {
        // API key revocation not yet implemented
    }
}
