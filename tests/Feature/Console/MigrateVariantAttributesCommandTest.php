<?php

use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Models\ProductVariant;
use App\Models\Shop;
use App\Models\Tenant;
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
});

it('creates ProductOption and ProductOptionValue records from variant attributes JSON', function () {
    $variant = ProductVariant::factory()->create([
        'product_id' => $this->product->id,
        'attributes' => ['color' => 'Red', 'size' => 'Large'],
    ]);

    $this->artisan('products:migrate-variant-attributes')
        ->expectsOutputToContain('Migrated 1 variants')
        ->assertSuccessful();

    $this->assertDatabaseHas('product_options', [
        'product_id' => $this->product->id,
        'name' => 'color',
    ]);

    $this->assertDatabaseHas('product_options', [
        'product_id' => $this->product->id,
        'name' => 'size',
    ]);

    $this->assertDatabaseHas('product_option_values', ['label' => 'Red', 'value' => 'red']);
    $this->assertDatabaseHas('product_option_values', ['label' => 'Large', 'value' => 'large']);

    expect($variant->fresh()->optionValues()->count())->toBe(2);
});

it('skips variants that already have option value pivot records', function () {
    $variant = ProductVariant::factory()->create([
        'product_id' => $this->product->id,
        'attributes' => ['color' => 'Blue'],
    ]);

    $option = ProductOption::query()->create([
        'product_id' => $this->product->id,
        'tenant_id' => $this->tenant->id,
        'name' => 'color',
        'position' => 0,
        'visual_type' => 'button_group',
    ]);
    $value = ProductOptionValue::query()->create([
        'product_option_id' => $option->id,
        'label' => 'Blue',
        'value' => 'blue',
        'position' => 0,
    ]);
    $variant->optionValues()->attach([$value->id]);

    $this->artisan('products:migrate-variant-attributes')
        ->expectsOutputToContain('Skipped 1')
        ->assertSuccessful();

    expect($variant->fresh()->optionValues()->count())->toBe(1);
});

it('does nothing when no variants have attributes JSON', function () {
    ProductVariant::factory()->create([
        'product_id' => $this->product->id,
        'attributes' => null,
    ]);

    $this->artisan('products:migrate-variant-attributes')
        ->expectsOutputToContain('Nothing to migrate')
        ->assertSuccessful();

    $this->assertDatabaseCount('product_options', 0);
});

it('does not write data in dry-run mode', function () {
    ProductVariant::factory()->create([
        'product_id' => $this->product->id,
        'attributes' => ['size' => 'XL'],
    ]);

    $this->artisan('products:migrate-variant-attributes', ['--dry-run' => true])
        ->expectsOutputToContain('DRY RUN')
        ->assertSuccessful();

    $this->assertDatabaseCount('product_options', 0);
    $this->assertDatabaseCount('product_option_values', 0);
});

it('scopes migration to a specific tenant when --tenant flag is provided', function () {
    $otherTenant = Tenant::factory()->create();
    $otherShop = Shop::factory()->create(['tenant_id' => $otherTenant->id]);
    $otherProduct = Product::factory()->create([
        'tenant_id' => $otherTenant->id,
        'shop_id' => $otherShop->id,
    ]);

    $ownVariant = ProductVariant::factory()->create([
        'product_id' => $this->product->id,
        'attributes' => ['color' => 'Green'],
    ]);

    $otherVariant = ProductVariant::factory()->create([
        'product_id' => $otherProduct->id,
        'attributes' => ['color' => 'Yellow'],
    ]);

    $this->artisan('products:migrate-variant-attributes', ['--tenant' => $this->tenant->id])
        ->expectsOutputToContain('Migrated 1 variants')
        ->assertSuccessful();

    expect($ownVariant->fresh()->optionValues()->count())->toBe(1);
    expect($otherVariant->fresh()->optionValues()->count())->toBe(0);
});
