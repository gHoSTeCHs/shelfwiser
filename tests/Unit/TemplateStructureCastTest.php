<?php

use App\Casts\TemplateStructureCast;
use Illuminate\Database\Eloquent\Model;

beforeEach(function () {
    $this->cast = new TemplateStructureCast;
    $this->model = Mockery::mock(Model::class);
});

afterEach(function () {
    Mockery::close();
});

test('cast accepts valid template structure with required variants array', function () {
    $value = [
        'variants' => [
            ['name' => 'Variant 1'],
            ['name' => 'Variant 2'],
        ],
    ];

    $result = $this->cast->set($this->model, 'template_structure', $value, []);

    expect($result)->toBeString();

    $decoded = json_decode($result, true);
    expect($decoded)->toBeArray()
        ->and($decoded['variants'])->toHaveCount(2)
        ->and($decoded['variants'][0]['name'])->toBe('Variant 1');
});

test('cast accepts template structure with all optional variant fields', function () {
    $structure = [
        'variants' => [
            [
                'name' => 'Standard',
                'sku_suffix' => 'STD',
                'attributes' => ['color' => 'blue', 'size' => 'medium'],
                'packaging_types' => [
                    [
                        'name' => 'single',
                        'units_per_package' => 1,
                        'is_base_unit' => true,
                    ],
                ],
            ],
        ],
    ];

    $result = $this->cast->set($this->model, 'template_structure', $structure, []);
    $decoded = json_decode($result, true);

    expect($decoded['variants'][0])
        ->toHaveKey('name')
        ->toHaveKey('sku_suffix')
        ->toHaveKey('attributes')
        ->toHaveKey('packaging_types')
        ->and($decoded['variants'][0]['attributes'])->toBe(['color' => 'blue', 'size' => 'medium']);
});

test('cast throws exception when template structure is not an array', function () {
    $this->cast->set($this->model, 'template_structure', 'invalid string', []);
})->throws(InvalidArgumentException::class, 'Template structure must be an array.');

test('cast throws exception when variants key is missing', function () {
    $this->cast->set($this->model, 'template_structure', ['some_other_key' => []], []);
})->throws(InvalidArgumentException::class, 'Template structure must contain a "variants" key.');

test('cast throws exception when variants is not an array', function () {
    $this->cast->set($this->model, 'template_structure', ['variants' => 'not an array'], []);
})->throws(InvalidArgumentException::class, 'Template structure "variants" must be an array.');

test('cast throws exception when variant is not an array', function () {
    $this->cast->set($this->model, 'template_structure', ['variants' => ['not an array']], []);
})->throws(InvalidArgumentException::class, 'Variant at index 0 must be an array.');

test('cast throws exception when variant name is missing', function () {
    $this->cast->set($this->model, 'template_structure', [
        'variants' => [
            ['sku_suffix' => 'STD'],
        ],
    ], []);
})->throws(InvalidArgumentException::class, "Variant at index 0 must have a non-empty 'name' field.");

test('cast throws exception when variant name is empty', function () {
    $this->cast->set($this->model, 'template_structure', [
        'variants' => [
            ['name' => ''],
        ],
    ], []);
})->throws(InvalidArgumentException::class, "Variant at index 0 must have a non-empty 'name' field.");

test('cast throws exception when packaging types is not an array', function () {
    $this->cast->set($this->model, 'template_structure', [
        'variants' => [
            [
                'name' => 'Standard',
                'packaging_types' => 'not an array',
            ],
        ],
    ], []);
})->throws(InvalidArgumentException::class, "Variant at index 0 'packaging_types' must be an array.");

test('cast throws exception when attributes is not an array', function () {
    $this->cast->set($this->model, 'template_structure', [
        'variants' => [
            [
                'name' => 'Standard',
                'attributes' => 'not an array',
            ],
        ],
    ], []);
})->throws(InvalidArgumentException::class, "Variant at index 0 'attributes' must be an array.");

test('cast returns null when value is null on get', function () {
    $result = $this->cast->get($this->model, 'template_structure', null, []);
    expect($result)->toBeNull();
});

test('cast encodes null when value is null on set', function () {
    $result = $this->cast->set($this->model, 'template_structure', null, []);
    expect($result)->toBe('null');
});

test('cast validates all variants in array', function () {
    $this->cast->set($this->model, 'template_structure', [
        'variants' => [
            ['name' => 'Valid Variant'],
            ['name' => ''],
        ],
    ], []);
})->throws(InvalidArgumentException::class, "Variant at index 1 must have a non-empty 'name' field.");

test('cast get method decodes JSON string properly', function () {
    $jsonString = json_encode([
        'variants' => [
            ['name' => 'Variant 1'],
            ['name' => 'Variant 2'],
        ],
    ]);

    $result = $this->cast->get($this->model, 'template_structure', $jsonString, []);

    expect($result)->toBeArray()
        ->and($result['variants'])->toHaveCount(2)
        ->and($result['variants'][0]['name'])->toBe('Variant 1');
});

test('cast get method handles already decoded array', function () {
    $array = [
        'variants' => [
            ['name' => 'Variant 1'],
        ],
    ];

    $result = $this->cast->get($this->model, 'template_structure', $array, []);

    expect($result)->toBeArray()
        ->and($result['variants'][0]['name'])->toBe('Variant 1');
});

test('cast get method returns null for invalid data type', function () {
    $result = $this->cast->get($this->model, 'template_structure', 'not valid json', []);
    expect($result)->toBeNull();
});

test('cast accepts empty variants array', function () {
    $result = $this->cast->set($this->model, 'template_structure', ['variants' => []], []);
    $decoded = json_decode($result, true);

    expect($decoded['variants'])->toBeArray()->toHaveCount(0);
});
