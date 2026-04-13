<?php

use App\Enums\OptionVisualType;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
use App\Services\VariantMatrixService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->product = Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'has_variants' => true,
    ]);
    $this->service = app(VariantMatrixService::class);
});

it('generates empty combinations for empty options', function () {
    $result = $this->service->generateCombinations($this->product, []);

    expect($result)->toBeEmpty();
});

it('generates single-axis combinations', function () {
    $result = $this->service->generateCombinations($this->product, [[1, 2, 3]]);

    expect($result)->toHaveCount(3);
    expect($result[0])->toBe([1]);
    expect($result[1])->toBe([2]);
    expect($result[2])->toBe([3]);
});

it('generates two-axis cartesian product', function () {
    $result = $this->service->generateCombinations($this->product, [[1, 2], [3, 4]]);

    expect($result)->toHaveCount(4);
    expect($result)->toContain([1, 3]);
    expect($result)->toContain([1, 4]);
    expect($result)->toContain([2, 3]);
    expect($result)->toContain([2, 4]);
});

it('generates three-axis cartesian product', function () {
    $result = $this->service->generateCombinations($this->product, [[1, 2], [3, 4], [5, 6]]);

    expect($result)->toHaveCount(8);
});

it('creates variants from matrix combinations with pivot attachment', function () {
    $sizeOption = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);
    $small = ProductOptionValue::query()->create([
        'product_option_id' => $sizeOption->id,
        'label' => 'Small',
        'value' => 'small',
        'position' => 1,
    ]);
    $large = ProductOptionValue::query()->create([
        'product_option_id' => $sizeOption->id,
        'label' => 'Large',
        'value' => 'large',
        'position' => 2,
    ]);

    $combinations = [[$small->id], [$large->id]];
    $created = $this->service->createVariantsFromMatrix($this->product, $combinations, ['price' => 500]);

    expect($created)->toHaveCount(2);

    $smallVariant = $created->first(fn ($v) => $v->name === 'Small');
    $largeVariant = $created->first(fn ($v) => $v->name === 'Large');

    expect($smallVariant)->not->toBeNull();
    expect($largeVariant)->not->toBeNull();

    $smallVariant->loadMissing('optionValues');
    expect($smallVariant->optionValues->pluck('id')->toArray())->toContain($small->id);

    $largeVariant->loadMissing('optionValues');
    expect($largeVariant->optionValues->pluck('id')->toArray())->toContain($large->id);
});

it('generates slash-separated name for multi-axis combinations', function () {
    $sizeOption = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);
    $colorOption = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'color',
        'display_name' => 'Color',
        'position' => 2,
        'visual_type' => OptionVisualType::Dropdown,
    ]);
    $small = ProductOptionValue::query()->create([
        'product_option_id' => $sizeOption->id,
        'label' => 'Small',
        'value' => 'small',
        'position' => 1,
    ]);
    $red = ProductOptionValue::query()->create([
        'product_option_id' => $colorOption->id,
        'label' => 'Red',
        'value' => 'red',
        'position' => 1,
    ]);

    $created = $this->service->createVariantsFromMatrix(
        $this->product,
        [[$small->id, $red->id]],
        ['price' => 500],
    );

    expect($created->first()->name)->toBe('Small / Red');
});

it('syncMatrix adds only new combinations and skips existing', function () {
    $sizeOption = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);
    $small = ProductOptionValue::query()->create([
        'product_option_id' => $sizeOption->id,
        'label' => 'Small',
        'value' => 'small',
        'position' => 1,
    ]);
    $large = ProductOptionValue::query()->create([
        'product_option_id' => $sizeOption->id,
        'label' => 'Large',
        'value' => 'large',
        'position' => 2,
    ]);

    $existingVariant = ProductVariant::factory()->create([
        'product_id' => $this->product->id,
        'name' => 'Small',
    ]);
    $existingVariant->optionValues()->attach([$small->id]);

    $result = $this->service->syncMatrix($this->product, [[$small->id, $large->id]]);

    expect($result['added'])->toBe(1);
    expect($result['skipped'])->toBe(1);
    expect($this->product->variants()->count())->toBe(2);
});

it('syncMatrix returns added=0 when all combinations exist', function () {
    $sizeOption = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'size',
        'display_name' => 'Size',
        'position' => 1,
        'visual_type' => OptionVisualType::Dropdown,
    ]);
    $small = ProductOptionValue::query()->create([
        'product_option_id' => $sizeOption->id,
        'label' => 'Small',
        'value' => 'small',
        'position' => 1,
    ]);

    $existingVariant = ProductVariant::factory()->create([
        'product_id' => $this->product->id,
    ]);
    $existingVariant->optionValues()->attach([$small->id]);

    $result = $this->service->syncMatrix($this->product, [[$small->id]]);

    expect($result['added'])->toBe(0);
    expect($result['skipped'])->toBe(1);
    expect($this->product->variants()->count())->toBe(1);
});

it('guardToggleHasVariantsFalse throws when multiple active variants exist', function () {
    ProductVariant::factory()->count(2)->create([
        'product_id' => $this->product->id,
        'is_active' => true,
    ]);

    expect(fn () => $this->service->guardToggleHasVariantsFalse($this->product))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
});

it('guardToggleHasVariantsFalse passes when only one active variant exists', function () {
    ProductVariant::factory()->create([
        'product_id' => $this->product->id,
        'is_active' => true,
    ]);

    expect(fn () => $this->service->guardToggleHasVariantsFalse($this->product))
        ->not->toThrow(\Illuminate\Validation\ValidationException::class);
});
