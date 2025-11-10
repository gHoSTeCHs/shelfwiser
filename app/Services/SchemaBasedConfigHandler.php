<?php

namespace App\Services;

use App\Contracts\ShopConfigHandler;

class SchemaBasedConfigHandler implements ShopConfigHandler
{
    public function __construct(
        private array $schema
    ) {}

    public function validate(array $config): bool
    {
        // If no schema properties defined, accept any array
        if (!isset($this->schema['properties'])) {
            return true;
        }

        $properties = $this->schema['properties'];
        $required = $this->schema['required'] ?? [];

        // Check required fields
        foreach ($required as $field) {
            if (!array_key_exists($field, $config)) {
                return false;
            }
        }

        // Validate each provided field
        foreach ($config as $key => $value) {
            // Skip fields not in schema (allows flexibility)
            if (!isset($properties[$key])) {
                continue;
            }

            $fieldSchema = $properties[$key];

            if (!$this->validateField($value, $fieldSchema)) {
                return false;
            }
        }

        return true;
    }

    public function getDefaults(): array
    {
        if (!isset($this->schema['properties'])) {
            return [];
        }

        $defaults = [];

        foreach ($this->schema['properties'] as $key => $fieldSchema) {
            if (isset($fieldSchema['default'])) {
                $defaults[$key] = $fieldSchema['default'];
            }
        }

        return $defaults;
    }

    private function validateField(mixed $value, array $fieldSchema): bool
    {
        $type = $fieldSchema['type'] ?? 'string';

        // Type validation
        switch ($type) {
            case 'string':
                if (!is_string($value)) {
                    return false;
                }

                // String validations
                if (isset($fieldSchema['minLength']) && strlen($value) < $fieldSchema['minLength']) {
                    return false;
                }
                if (isset($fieldSchema['maxLength']) && strlen($value) > $fieldSchema['maxLength']) {
                    return false;
                }
                if (isset($fieldSchema['enum']) && !in_array($value, $fieldSchema['enum'])) {
                    return false;
                }
                if (isset($fieldSchema['pattern']) && !preg_match('/' . $fieldSchema['pattern'] . '/', $value)) {
                    return false;
                }
                break;

            case 'integer':
                if (!is_int($value)) {
                    return false;
                }

                if (isset($fieldSchema['minimum']) && $value < $fieldSchema['minimum']) {
                    return false;
                }
                if (isset($fieldSchema['maximum']) && $value > $fieldSchema['maximum']) {
                    return false;
                }
                break;

            case 'number':
                if (!is_numeric($value)) {
                    return false;
                }

                if (isset($fieldSchema['minimum']) && $value < $fieldSchema['minimum']) {
                    return false;
                }
                if (isset($fieldSchema['maximum']) && $value > $fieldSchema['maximum']) {
                    return false;
                }
                break;

            case 'boolean':
                if (!is_bool($value)) {
                    return false;
                }
                break;

            case 'array':
                if (!is_array($value)) {
                    return false;
                }

                // Validate array items if schema defined
                if (isset($fieldSchema['items'])) {
                    foreach ($value as $item) {
                        if (!$this->validateField($item, $fieldSchema['items'])) {
                            return false;
                        }
                    }
                }
                break;

            case 'object':
                if (!is_array($value)) {
                    return false;
                }

                // Recursively validate nested object
                if (isset($fieldSchema['properties'])) {
                    $nestedHandler = new self(['properties' => $fieldSchema['properties'], 'required' => $fieldSchema['required'] ?? []]);
                    if (!$nestedHandler->validate($value)) {
                        return false;
                    }
                }
                break;
        }

        return true;
    }
}
