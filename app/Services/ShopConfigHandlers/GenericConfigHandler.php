<?php

namespace App\Services\ShopConfigHandlers;

use App\Contracts\ShopConfigHandler;
use Illuminate\Support\Facades\Validator;

class GenericConfigHandler implements ShopConfigHandler
{
    public function validate(array $config): bool
    {
        return Validator::make($config, [
            '*' => 'array',
        ])->passes();
    }

    public function getDefaults(): array
    {
        return [
            'notes' => 'Generic shop configuration',
        ];
    }
}
