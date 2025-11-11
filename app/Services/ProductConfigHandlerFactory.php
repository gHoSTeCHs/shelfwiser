<?php

namespace App\Services;

use App\Models\ProductType;

class ProductConfigHandlerFactory
{
    public static function make(ProductType|array $schemaSource): SchemaBasedConfigHandler
    {
        $schema = $schemaSource instanceof ProductType
            ? $schemaSource->config_schema
            : $schemaSource;

        if (empty($schema)) {
            $schema = ['properties' => [], 'required' => []];
        }

        return new SchemaBasedConfigHandler($schema);
    }
}
