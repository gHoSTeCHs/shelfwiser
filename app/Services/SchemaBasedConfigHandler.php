<?php

namespace App\Services;

use App\Contracts\ShopConfigHandler;
use Illuminate\Support\Facades\Log;

class SchemaBasedConfigHandler implements ShopConfigHandler
{
    public function __construct(
        private array $schema
    )
    {
    }

    public function validate(array $config): bool
    {
        if (!isset($this->schema['properties'])) {
            return true;
        }

        $properties = $this->schema['properties'];
        $required = $this->schema['required'] ?? [];

        foreach ($required as $field) {
            if (!array_key_exists($field, $config)) {
                Log::warning('Shop config validation failed: missing required field.', [
                    'field' => $field,
                    'config' => $config,
                ]);
                return false;
            }
        }

        foreach ($config as $key => $value) {
            if (!isset($properties[$key])) {
                continue;
            }

            $fieldSchema = $properties[$key];

            if (!$this->validateField($value, $fieldSchema, $key)) {
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

    private function validateField(mixed $value, array $fieldSchema, string $key): bool
    {
        $type = $fieldSchema['type'] ?? 'string';

        switch ($type) {
            case 'string':
                if (!is_string($value)) {
                    $this->logFailure($key, $value, 'type', 'string');
                    return false;
                }

                if (isset($fieldSchema['minLength']) && strlen($value) < $fieldSchema['minLength']) {
                    $this->logFailure($key, $value, 'minLength', $fieldSchema['minLength']);
                    return false;
                }
                if (isset($fieldSchema['maxLength']) && strlen($value) > $fieldSchema['maxLength']) {
                    $this->logFailure($key, $value, 'maxLength', $fieldSchema['maxLength']);
                    return false;
                }
                if (isset($fieldSchema['enum']) && !in_array($value, $fieldSchema['enum'])) {
                    $this->logFailure($key, $value, 'enum', $fieldSchema['enum']);
                    return false;
                }
                if (isset($fieldSchema['pattern']) && !preg_match('/' . $fieldSchema['pattern'] . '/', $value)) {
                    $this->logFailure($key, $value, 'pattern', $fieldSchema['pattern']);
                    return false;
                }
                break;

            case 'integer':
                if (!is_int($value)) {
                    $this->logFailure($key, $value, 'type', 'integer');
                    return false;
                }

                if (isset($fieldSchema['minimum']) && $value < $fieldSchema['minimum']) {
                    $this->logFailure($key, $value, 'minimum', $fieldSchema['minimum']);
                    return false;
                }
                if (isset($fieldSchema['maximum']) && $value > $fieldSchema['maximum']) {
                    $this->logFailure($key, $value, 'maximum', $fieldSchema['maximum']);
                    return false;
                }
                break;

            case 'number':
                if (!is_numeric($value)) {
                    $this->logFailure($key, $value, 'type', 'number');
                    return false;
                }

                if (isset($fieldSchema['minimum']) && $value < $fieldSchema['minimum']) {
                    $this->logFailure($key, $value, 'minimum', $fieldSchema['minimum']);
                    return false;
                }
                if (isset($fieldSchema['maximum']) && $value > $fieldSchema['maximum']) {
                    $this->logFailure($key, $value, 'maximum', $fieldSchema['maximum']);
                    return false;
                }
                break;

            case 'boolean':
                if (!is_bool($value)) {
                    $this->logFailure($key, $value, 'type', 'boolean');
                    return false;
                }
                break;

            case 'array':
                if (!is_array($value)) {
                    $this->logFailure($key, $value, 'type', 'array');
                    return false;
                }

                if (isset($fieldSchema['items'])) {
                    foreach ($value as $item) {
                        if (!$this->validateField($item, $fieldSchema['items'], "{$key}[]")) {
                            return false;
                        }
                    }
                }
                break;

            case 'object':
                if (!is_array($value)) {
                    $this->logFailure($key, $value, 'type', 'object');
                    return false;
                }

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

    private function logFailure(string $key, mixed $value, string $rule, mixed $expected): void
    {
        Log::warning('Shop config validation failed.', [
            'key' => $key,
            'value' => $value,
            'rule' => $rule,
            'expected' => $expected,
        ]);
    }
}
