<?php

namespace Database\Seeders;

use App\Models\Image;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductType;
use App\Models\ProductVariant;
use App\Models\Shop;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    protected array $productTypeCache = [];
    protected array $categoryCache = [];

    public function run(): void
    {
        $shops = Shop::with('tenant')->get();

        foreach ($shops as $shop) {
            $this->productTypeCache[$shop->tenant_id] = ProductType::query()
                ->accessibleTo($shop->tenant_id)
                ->pluck('id', 'slug')
                ->toArray();

            $this->categoryCache[$shop->tenant_id] = ProductCategory::query()
                ->where('tenant_id', $shop->tenant_id)
                ->pluck('id', 'slug')
                ->toArray();

            $productCount = rand(12, 18);
            $this->createProductsForShop($shop, $productCount);
        }
    }

    protected function createProductsForShop(Shop $shop, int $count): void
    {
        $products = $this->getProductTemplates($shop);

        $selectedProducts = array_rand($products, min($count, count($products)));
        if (!is_array($selectedProducts)) {
            $selectedProducts = [$selectedProducts];
        }

        foreach ($selectedProducts as $key) {
            $template = $products[$key];

            $product = Product::create([
                'tenant_id' => $shop->tenant_id,
                'shop_id' => $shop->id,
                'product_type_id' => $this->getProductTypeId($shop->tenant_id, $template['type']),
                'category_id' => $this->getCategoryId($shop->tenant_id, $template['category']),
                'name' => $template['name'],
                'slug' => $this->generateSlug($template['name']),
                'description' => $template['description'] ?? null,
                'custom_attributes' => $template['attributes'] ?? null,
                'has_variants' => $template['has_variants'] ?? false,
                'is_active' => true,
            ]);

            $this->createVariantsForProduct($product, $template);
            $this->createImagesForProduct($product);
        }
    }

    /**
     * Create placeholder images for a product
     */
    protected function createImagesForProduct(Product $product): void
    {
        $imageCount = rand(1, 3);

        for ($i = 0; $i < $imageCount; $i++) {
            Image::create([
                'tenant_id' => $product->tenant_id,
                'imageable_type' => Product::class,
                'imageable_id' => $product->id,
                'filename' => 'placeholder.jpg',
                'path' => 'https://placehold.co/600x400',
                'disk' => 'public',
                'mime_type' => 'image/jpeg',
                'size' => 0,
                'width' => 600,
                'height' => 400,
                'alt_text' => $product->name,
                'title' => $product->name,
                'caption' => $product->description,
                'is_primary' => $i === 0,
                'sort_order' => $i,
            ]);
        }
    }

    protected function createVariantsForProduct(Product $product, array $template): void
    {
        $variants = $template['variants'] ?? [];

        foreach ($variants as $variantData) {
            $sku = $this->generateSKU($product);

            ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $sku,
                'barcode' => $this->generateBarcode($sku),
                'name' => $variantData['name'] ?? null,
                'attributes' => $variantData['attributes'] ?? null,
                'price' => $variantData['price'],
                'cost_price' => $variantData['cost_price'],
                'reorder_level' => $variantData['reorder_level'] ?? 10,
                'base_unit_name' => $variantData['base_unit'] ?? 'unit',
                'batch_number' => $variantData['batch_number'] ?? null,
                'expiry_date' => $variantData['expiry_date'] ?? null,
                'serial_number' => $variantData['serial_number'] ?? null,
                'is_active' => true,
            ]);
        }
    }

    protected function getProductTemplates(Shop $shop): array
    {
        return [
            [
                'name' => 'Samsung Galaxy S24',
                'type' => 'electronics',
                'category' => 'electronics',
                'description' => 'Latest flagship smartphone with advanced AI features',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '128GB Black',
                        'attributes' => ['storage' => '128GB', 'color' => 'Black'],
                        'price' => 450000.00,
                        'cost_price' => 380000.00,
                        'reorder_level' => 5,
                        'base_unit' => 'unit',
                    ],
                    [
                        'name' => '256GB White',
                        'attributes' => ['storage' => '256GB', 'color' => 'White'],
                        'price' => 520000.00,
                        'cost_price' => 440000.00,
                        'reorder_level' => 5,
                        'base_unit' => 'unit',
                    ],
                ],
            ],
            [
                'name' => 'Indomie Instant Noodles',
                'type' => 'food_beverage',
                'category' => 'food-beverages',
                'description' => 'Popular instant noodles',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => 'Chicken Flavor',
                        'attributes' => ['flavor' => 'Chicken'],
                        'price' => 100.00,
                        'cost_price' => 70.00,
                        'reorder_level' => 200,
                        'base_unit' => 'pack',
                        'batch_number' => 'INDO-2024-001',
                        'expiry_date' => '2025-06-30',
                    ],
                    [
                        'name' => 'Jollof Flavor',
                        'attributes' => ['flavor' => 'Jollof'],
                        'price' => 100.00,
                        'cost_price' => 70.00,
                        'reorder_level' => 200,
                        'base_unit' => 'pack',
                        'batch_number' => 'INDO-2024-002',
                        'expiry_date' => '2025-06-30',
                    ],
                ],
            ],
            [
                'name' => 'Peak Milk Powder',
                'type' => 'food_beverage',
                'category' => 'groceries',
                'description' => 'Premium powdered milk',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '400g Tin',
                        'attributes' => ['size' => '400g', 'packaging' => 'tin'],
                        'price' => 1800.00,
                        'cost_price' => 1400.00,
                        'reorder_level' => 50,
                        'base_unit' => 'tin',
                        'batch_number' => 'PEAK-2024-045',
                        'expiry_date' => '2025-12-31',
                    ],
                    [
                        'name' => '900g Tin',
                        'attributes' => ['size' => '900g', 'packaging' => 'tin'],
                        'price' => 3800.00,
                        'cost_price' => 3000.00,
                        'reorder_level' => 30,
                        'base_unit' => 'tin',
                        'batch_number' => 'PEAK-2024-046',
                        'expiry_date' => '2025-12-31',
                    ],
                ],
            ],
            [
                'name' => 'Coca-Cola',
                'type' => 'food_beverage',
                'category' => 'food-beverages',
                'description' => 'Classic soft drink',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '50cl Bottle',
                        'attributes' => ['size' => '50cl', 'packaging' => 'bottle'],
                        'price' => 250.00,
                        'cost_price' => 180.00,
                        'reorder_level' => 100,
                        'base_unit' => 'bottle',
                        'batch_number' => 'COKE-2024-234',
                        'expiry_date' => '2025-09-30',
                    ],
                    [
                        'name' => '1.5L Bottle',
                        'attributes' => ['size' => '1.5L', 'packaging' => 'bottle'],
                        'price' => 600.00,
                        'cost_price' => 450.00,
                        'reorder_level' => 50,
                        'base_unit' => 'bottle',
                        'batch_number' => 'COKE-2024-235',
                        'expiry_date' => '2025-09-30',
                    ],
                ],
            ],
            [
                'name' => 'Paracetamol Tablets',
                'type' => 'pharmaceutical',
                'category' => 'health-wellness',
                'description' => 'Pain relief medication',
                'has_variants' => false,
                'variants' => [
                    [
                        'name' => null,
                        'attributes' => null,
                        'price' => 500.00,
                        'cost_price' => 350.00,
                        'reorder_level' => 100,
                        'base_unit' => 'pack',
                        'batch_number' => 'PARA-2024-567',
                        'expiry_date' => '2026-03-31',
                    ],
                ],
            ],
            [
                'name' => 'Hand Sanitizer',
                'type' => 'cosmetics_beauty',
                'category' => 'personal-care',
                'description' => 'Alcohol-based hand sanitizer',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '50ml',
                        'attributes' => ['size' => '50ml'],
                        'price' => 500.00,
                        'cost_price' => 350.00,
                        'reorder_level' => 50,
                        'base_unit' => 'bottle',
                        'batch_number' => 'SAN-2024-089',
                        'expiry_date' => '2026-01-31',
                    ],
                    [
                        'name' => '200ml',
                        'attributes' => ['size' => '200ml'],
                        'price' => 1500.00,
                        'cost_price' => 1100.00,
                        'reorder_level' => 30,
                        'base_unit' => 'bottle',
                        'batch_number' => 'SAN-2024-090',
                        'expiry_date' => '2026-01-31',
                    ],
                ],
            ],
            [
                'name' => 'Nike Air Max Sneakers',
                'type' => 'clothing_apparel',
                'category' => 'clothing-fashion',
                'description' => 'Premium athletic footwear',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => 'Size 42 Black',
                        'attributes' => ['size' => '42', 'color' => 'Black'],
                        'price' => 45000.00,
                        'cost_price' => 35000.00,
                        'reorder_level' => 5,
                        'base_unit' => 'pair',
                    ],
                    [
                        'name' => 'Size 43 White',
                        'attributes' => ['size' => '43', 'color' => 'White'],
                        'price' => 45000.00,
                        'cost_price' => 35000.00,
                        'reorder_level' => 5,
                        'base_unit' => 'pair',
                    ],
                ],
            ],
            [
                'name' => 'Rice - Long Grain',
                'type' => 'food_beverage',
                'category' => 'groceries',
                'description' => 'Premium quality rice',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '5kg Bag',
                        'attributes' => ['weight' => '5kg'],
                        'price' => 5500.00,
                        'cost_price' => 4500.00,
                        'reorder_level' => 30,
                        'base_unit' => 'bag',
                    ],
                    [
                        'name' => '25kg Bag',
                        'attributes' => ['weight' => '25kg'],
                        'price' => 25000.00,
                        'cost_price' => 21000.00,
                        'reorder_level' => 20,
                        'base_unit' => 'bag',
                    ],
                ],
            ],
            [
                'name' => 'Cooking Oil',
                'type' => 'food_beverage',
                'category' => 'groceries',
                'description' => 'Vegetable cooking oil',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '1 Liter',
                        'attributes' => ['volume' => '1L'],
                        'price' => 1800.00,
                        'cost_price' => 1400.00,
                        'reorder_level' => 40,
                        'base_unit' => 'bottle',
                        'batch_number' => 'OIL-2024-123',
                        'expiry_date' => '2025-08-31',
                    ],
                    [
                        'name' => '5 Liter',
                        'attributes' => ['volume' => '5L'],
                        'price' => 8500.00,
                        'cost_price' => 7200.00,
                        'reorder_level' => 20,
                        'base_unit' => 'bottle',
                        'batch_number' => 'OIL-2024-124',
                        'expiry_date' => '2025-08-31',
                    ],
                ],
            ],
            [
                'name' => 'Logitech Wireless Mouse',
                'type' => 'electronics',
                'category' => 'electronics',
                'description' => 'Ergonomic wireless mouse',
                'has_variants' => false,
                'variants' => [
                    [
                        'name' => null,
                        'attributes' => null,
                        'price' => 8500.00,
                        'cost_price' => 6500.00,
                        'reorder_level' => 15,
                        'base_unit' => 'unit',
                    ],
                ],
            ],
            [
                'name' => 'Toilet Paper',
                'type' => 'building_materials',
                'category' => 'personal-care',
                'description' => 'Soft tissue paper',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '4 Rolls',
                        'attributes' => ['quantity' => '4 rolls'],
                        'price' => 1200.00,
                        'cost_price' => 900.00,
                        'reorder_level' => 50,
                        'base_unit' => 'pack',
                    ],
                    [
                        'name' => '12 Rolls',
                        'attributes' => ['quantity' => '12 rolls'],
                        'price' => 3200.00,
                        'cost_price' => 2500.00,
                        'reorder_level' => 30,
                        'base_unit' => 'pack',
                    ],
                ],
            ],
            [
                'name' => 'Detergent Powder',
                'type' => 'cosmetics_beauty',
                'category' => 'personal-care',
                'description' => 'Laundry detergent',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '500g',
                        'attributes' => ['weight' => '500g'],
                        'price' => 1500.00,
                        'cost_price' => 1100.00,
                        'reorder_level' => 40,
                        'base_unit' => 'pack',
                    ],
                    [
                        'name' => '2kg',
                        'attributes' => ['weight' => '2kg'],
                        'price' => 5000.00,
                        'cost_price' => 3800.00,
                        'reorder_level' => 20,
                        'base_unit' => 'pack',
                    ],
                ],
            ],
            [
                'name' => 'Chocolate Bar',
                'type' => 'food_beverage',
                'category' => 'snacks-confectionery',
                'description' => 'Milk chocolate bar',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => 'Regular',
                        'attributes' => ['size' => 'regular'],
                        'price' => 300.00,
                        'cost_price' => 200.00,
                        'reorder_level' => 100,
                        'base_unit' => 'bar',
                        'batch_number' => 'CHOC-2024-456',
                        'expiry_date' => '2025-10-31',
                    ],
                    [
                        'name' => 'King Size',
                        'attributes' => ['size' => 'king'],
                        'price' => 500.00,
                        'cost_price' => 350.00,
                        'reorder_level' => 80,
                        'base_unit' => 'bar',
                        'batch_number' => 'CHOC-2024-457',
                        'expiry_date' => '2025-10-31',
                    ],
                ],
            ],
            [
                'name' => 'Bread - White',
                'type' => 'food_beverage',
                'category' => 'food-beverages',
                'description' => 'Freshly baked white bread',
                'has_variants' => false,
                'variants' => [
                    [
                        'name' => null,
                        'attributes' => null,
                        'price' => 800.00,
                        'cost_price' => 600.00,
                        'reorder_level' => 50,
                        'base_unit' => 'loaf',
                        'batch_number' => 'BREAD-2024-789',
                        'expiry_date' => '2025-01-05',
                    ],
                ],
            ],
            [
                'name' => 'Eggs - Large',
                'type' => 'food_beverage',
                'category' => 'groceries',
                'description' => 'Fresh farm eggs',
                'has_variants' => false,
                'variants' => [
                    [
                        'name' => null,
                        'attributes' => null,
                        'price' => 2500.00,
                        'cost_price' => 2000.00,
                        'reorder_level' => 30,
                        'base_unit' => 'crate',
                    ],
                ],
            ],
            [
                'name' => 'HP Laptop Charger',
                'type' => 'electronics',
                'category' => 'electronics',
                'description' => 'Compatible HP laptop charger',
                'has_variants' => false,
                'variants' => [
                    [
                        'name' => null,
                        'attributes' => null,
                        'price' => 12000.00,
                        'cost_price' => 9000.00,
                        'reorder_level' => 10,
                        'base_unit' => 'unit',
                    ],
                ],
            ],
            [
                'name' => 'Plastic Chair',
                'type' => 'furniture_home',
                'category' => 'home-kitchen',
                'description' => 'Durable plastic chair',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => 'White',
                        'attributes' => ['color' => 'White'],
                        'price' => 3500.00,
                        'cost_price' => 2800.00,
                        'reorder_level' => 10,
                        'base_unit' => 'unit',
                    ],
                    [
                        'name' => 'Blue',
                        'attributes' => ['color' => 'Blue'],
                        'price' => 3500.00,
                        'cost_price' => 2800.00,
                        'reorder_level' => 10,
                        'base_unit' => 'unit',
                    ],
                ],
            ],
            [
                'name' => 'Ceiling Fan',
                'type' => 'electronics',
                'category' => 'home-kitchen',
                'description' => 'Energy efficient ceiling fan',
                'has_variants' => false,
                'variants' => [
                    [
                        'name' => null,
                        'attributes' => null,
                        'price' => 25000.00,
                        'cost_price' => 19000.00,
                        'reorder_level' => 5,
                        'base_unit' => 'unit',
                    ],
                ],
            ],
            [
                'name' => 'Biscuits - Digestive',
                'type' => 'food_beverage',
                'category' => 'snacks-confectionery',
                'description' => 'Crunchy digestive biscuits',
                'has_variants' => false,
                'variants' => [
                    [
                        'name' => null,
                        'attributes' => null,
                        'price' => 800.00,
                        'cost_price' => 600.00,
                        'reorder_level' => 60,
                        'base_unit' => 'pack',
                        'batch_number' => 'BISC-2024-345',
                        'expiry_date' => '2025-07-31',
                    ],
                ],
            ],
            [
                'name' => 'Body Lotion',
                'type' => 'cosmetics_beauty',
                'category' => 'personal-care',
                'description' => 'Moisturizing body lotion',
                'has_variants' => true,
                'variants' => [
                    [
                        'name' => '100ml',
                        'attributes' => ['size' => '100ml'],
                        'price' => 1800.00,
                        'cost_price' => 1300.00,
                        'reorder_level' => 30,
                        'base_unit' => 'bottle',
                        'batch_number' => 'LOT-2024-567',
                        'expiry_date' => '2026-05-31',
                    ],
                    [
                        'name' => '400ml',
                        'attributes' => ['size' => '400ml'],
                        'price' => 5500.00,
                        'cost_price' => 4200.00,
                        'reorder_level' => 20,
                        'base_unit' => 'bottle',
                        'batch_number' => 'LOT-2024-568',
                        'expiry_date' => '2026-05-31',
                    ],
                ],
            ],
        ];
    }

    protected function getProductTypeId(int $tenantId, string $slug): ?int
    {
        return $this->productTypeCache[$tenantId][$slug] ?? null;
    }

    protected function getCategoryId(int $tenantId, string $slug): ?int
    {
        return $this->categoryCache[$tenantId][$slug] ?? null;
    }

    protected function generateSlug(string $name): string
    {
        return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'))
            . '-' . substr(md5($name . microtime()), 0, 6);
    }

    protected function generateSKU(Product $product): string
    {
        $shopCode = strtoupper(substr($product->shop->slug, 0, 3));
        $productCode = strtoupper(substr($product->slug, 0, 6));
        $random = strtoupper(substr(uniqid(), -4));

        return "{$shopCode}-{$productCode}-{$random}";
    }

    protected function generateBarcode(string $sku): string
    {
        return '978' . substr(md5($sku), 0, 10);
    }
}
