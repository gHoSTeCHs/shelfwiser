<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/**
 * Custom Eloquent cast for validating and handling ProductTemplate template_structure JSON field.
 *
 * Ensures the template structure adheres to the expected schema:
 * - Must contain a 'variants' array
 * - Each variant must have a 'name' field
 * - Variants may optionally include 'sku_suffix', 'attributes', and 'packaging_types'
 *
 * @implements CastsAttributes<array, array>
 */
class TemplateStructureCast implements CastsAttributes
{
    /**
     * Cast the given value from storage.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null) {
            return null;
        }

        $decoded = is_string($value) ? json_decode($value, true) : $value;

        if (! is_array($decoded)) {
            return null;
        }

        return $decoded;
    }

    /**
     * Prepare the given value for storage.
     *
     * Validates the structure before storing:
     * - Must be an array with a 'variants' key
     * - 'variants' must be an array
     * - Each variant must have a 'name' field
     *
     * @param  array<string, mixed>  $attributes
     *
     * @throws InvalidArgumentException When structure validation fails
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        if ($value === null) {
            return json_encode(null);
        }

        if (! is_array($value)) {
            throw new InvalidArgumentException('Template structure must be an array.');
        }

        $this->validateStructure($value);

        return json_encode($value);
    }

    /**
     * Validate the template structure against the expected schema.
     *
     * @param  array<string, mixed>  $structure
     *
     * @throws InvalidArgumentException When validation fails
     */
    protected function validateStructure(array $structure): void
    {
        if (! array_key_exists('variants', $structure)) {
            throw new InvalidArgumentException('Template structure must contain a "variants" key.');
        }

        if (! is_array($structure['variants'])) {
            throw new InvalidArgumentException('Template structure "variants" must be an array.');
        }

        foreach ($structure['variants'] as $index => $variant) {
            if (! is_array($variant)) {
                throw new InvalidArgumentException("Variant at index {$index} must be an array.");
            }

            if (! isset($variant['name']) || empty($variant['name'])) {
                throw new InvalidArgumentException("Variant at index {$index} must have a non-empty 'name' field.");
            }

            if (isset($variant['packaging_types'])) {
                if (! is_array($variant['packaging_types'])) {
                    throw new InvalidArgumentException("Variant at index {$index} 'packaging_types' must be an array.");
                }
            }

            if (isset($variant['attributes'])) {
                if (! is_array($variant['attributes'])) {
                    throw new InvalidArgumentException("Variant at index {$index} 'attributes' must be an array.");
                }
            }
        }
    }
}
