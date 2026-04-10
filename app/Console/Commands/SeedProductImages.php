<?php

namespace App\Console\Commands;

use App\Models\Image;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Console\Command;

class SeedProductImages extends Command
{
    protected $signature = 'catalog:seed-images';

    protected $description = 'Replace placeholder product and category images with curated Unsplash photos';

    private array $productImageMap = [
        'samsung' => 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=800&fit=crop&q=80',
        'iphone' => 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=800&fit=crop&q=80',
        'laptop' => 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=800&fit=crop&q=80',
        'charger' => 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=800&fit=crop&q=80',
        'mouse' => 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=800&fit=crop&q=80',
        'earbuds' => 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=800&fit=crop&q=80',
        'headphone' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=800&fit=crop&q=80',
        'speaker' => 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=800&fit=crop&q=80',
        'fan' => 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&h=800&fit=crop&q=80',
        'sneaker' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop&q=80',
        'nike' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop&q=80',
        'shirt' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop&q=80',
        'dress' => 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&q=80',
        'jeans' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop&q=80',
        'fabric' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&q=80',
        'ankara' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&q=80',
        'lotion' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=800&fit=crop&q=80',
        'serum' => 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=800&fit=crop&q=80',
        'cream' => 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=800&fit=crop&q=80',
        'sanitizer' => 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=600&h=800&fit=crop&q=80',
        'soap' => 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=600&h=800&fit=crop&q=80',
        'paracetamol' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=800&fit=crop&q=80',
        'vitamin' => 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&h=800&fit=crop&q=80',
        'tablet' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=800&fit=crop&q=80',
        'rice' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=800&fit=crop&q=80',
        'bread' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=800&fit=crop&q=80',
        'egg' => 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&h=800&fit=crop&q=80',
        'noodle' => 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=800&fit=crop&q=80',
        'indomie' => 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=800&fit=crop&q=80',
        'coca' => 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&h=800&fit=crop&q=80',
        'juice' => 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&h=800&fit=crop&q=80',
        'chocolate' => 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&h=800&fit=crop&q=80',
        'cooking oil' => 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=800&fit=crop&q=80',
        'detergent' => 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&h=800&fit=crop&q=80',
        'toilet' => 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&h=800&fit=crop&q=80',
        'chair' => 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=800&fit=crop&q=80',
        'basket' => 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=800&fit=crop&q=80',
    ];

    private array $categoryImageMap = [
        'electronics' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop&q=80',
        'fashion' => 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop&q=80',
        'clothing' => 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop&q=80',
        'beauty' => 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop&q=80',
        'skincare' => 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop&q=80',
        'home' => 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&h=600&fit=crop&q=80',
        'food' => 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop&q=80',
        'beverage' => 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop&q=80',
        'grocery' => 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop&q=80',
        'health' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
        'wellness' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
        'personal' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop&q=80',
        'snack' => 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=600&fit=crop&q=80',
        'confection' => 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=600&fit=crop&q=80',
        'kitchen' => 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&q=80',
    ];

    private string $fallbackProduct = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=800&fit=crop&q=80';

    private string $fallbackCategory = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&q=80';

    public function handle(): int
    {
        $this->updateProductImages();
        $this->updateCategoryImages();

        return self::SUCCESS;
    }

    private function updateProductImages(): void
    {
        $updated = 0;
        $products = Product::query()
            ->with('images')
            ->get();

        foreach ($products as $product) {
            $url = $this->matchProductImage($product->name);

            foreach ($product->images as $image) {
                if ($image->path === $url) {
                    continue;
                }
                $image->update(['path' => $url]);
                $updated++;
            }

            if ($product->images->isEmpty()) {
                Image::query()->create([
                    'tenant_id' => $product->tenant_id,
                    'imageable_type' => Product::class,
                    'imageable_id' => $product->id,
                    'filename' => $product->slug.'.jpg',
                    'path' => $url,
                    'disk' => 'public',
                    'mime_type' => 'image/jpeg',
                    'size' => 0,
                    'width' => 600,
                    'height' => 800,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
                $updated++;
            }
        }

        $this->info("Updated {$updated} product images across {$products->count()} products.");
    }

    private function updateCategoryImages(): void
    {
        $updated = 0;
        $categories = ProductCategory::query()->with('images')->get();

        foreach ($categories as $category) {
            $url = $this->matchCategoryImage($category->name);

            if ($category->images->isNotEmpty()) {
                foreach ($category->images as $image) {
                    if ($image->path !== $url) {
                        $image->update(['path' => $url]);
                        $updated++;
                    }
                }
            } else {
                Image::query()->create([
                    'tenant_id' => $category->tenant_id,
                    'imageable_type' => ProductCategory::class,
                    'imageable_id' => $category->id,
                    'filename' => $category->slug.'.jpg',
                    'path' => $url,
                    'disk' => 'public',
                    'mime_type' => 'image/jpeg',
                    'size' => 0,
                    'width' => 800,
                    'height' => 600,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
                $updated++;
            }
        }

        $this->info("Updated {$updated} category images.");
    }

    private function matchProductImage(string $name): string
    {
        $lower = strtolower($name);

        foreach ($this->productImageMap as $keyword => $url) {
            if (str_contains($lower, $keyword)) {
                return $url;
            }
        }

        return $this->fallbackProduct;
    }

    private function matchCategoryImage(string $name): string
    {
        $lower = strtolower($name);

        foreach ($this->categoryImageMap as $keyword => $url) {
            if (str_contains($lower, $keyword)) {
                return $url;
            }
        }

        return $this->fallbackCategory;
    }
}
