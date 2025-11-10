<?php

namespace App\Services;

use App\Contracts\ShopConfigHandler;
use App\Services\ShopConfigHandlers\GenericConfigHandler;
use App\Services\ShopConfigHandlers\PharmacyConfigHandler;
use App\Services\ShopConfigHandlers\RestaurantConfigHandler;
use App\Services\ShopConfigHandlers\RetailConfigHandler;

class ShopConfigHandlerFactory
{
    private const HANDLERS = [
        'retail' => RetailConfigHandler::class,
        'pharmacy' => PharmacyConfigHandler::class,
        'restaurant' => RestaurantConfigHandler::class,
    ];

    public static function make(string $slug): ShopConfigHandler
    {
        $handler = self::HANDLERS[$slug] ?? GenericConfigHandler::class;
        return new $handler();
    }
}
