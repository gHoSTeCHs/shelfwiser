<?php

namespace App\Services\ShopConfigHandlers;

use App\Contracts\ShopConfigHandler;
use Illuminate\Support\Facades\Validator;

class RetailConfigHandler implements ShopConfigHandler
{
    public function validate(array $config): bool
    {
        return Validator::make($config, [
            'tax_rate' => 'required|numeric|min:0|max:1',
            'pos_hardware' => 'required|in:square,clover,none',
            'returns_policy_days' => 'required|integer|min:0|max:365',
            'loyalty_program' => 'present|array',
            'loyalty_program.enabled' => 'boolean',
            'loyalty_program.tiers' => 'array',
        ])->passes();
    }

    public function getDefaults(): array
    {
        return [
            'tax_rate' => 0.08,
            'pos_hardware' => 'none',
            'returns_policy_days' => 30,
            'loyalty_program' => [
                'enabled' => false,
                'tiers' => ['bronze', 'silver', 'gold'],
            ],
        ];
    }
}
