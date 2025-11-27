<?php

namespace App\Services;

use App\Contracts\ShopConfigHandler;
use App\Models\ShopType;

class ShopConfigHandlerFactory
{
    /**
     * Create a schema-based config handler from a shop type or schema array.
     */
    public static function make(ShopType|array $schemaSource): ShopConfigHandler
    {
        $schema = $schemaSource instanceof ShopType
            ? $schemaSource->config_schema
            : $schemaSource;

        if (empty($schema)) {
            $schema = ['properties' => [], 'required' => []];
        }

        return new SchemaBasedConfigHandler($schema);
    }
}
