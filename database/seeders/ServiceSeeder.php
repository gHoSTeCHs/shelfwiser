<?php

namespace Database\Seeders;

use App\Models\Image;
use App\Models\Service;
use App\Models\ServiceAddon;
use App\Models\ServiceCategory;
use App\Models\ServiceVariant;
use App\Models\Shop;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    protected array $categoryCache = [];

    public function run(): void
    {
        $shops = Shop::with('tenant')->get();

        foreach ($shops as $shop) {
            // Only seed services for shops that offer services or both
            if (in_array($shop->shop_offering_type, ['services', 'both'])) {
                $this->categoryCache[$shop->tenant_id] = ServiceCategory::query()
                    ->where('tenant_id', $shop->tenant_id)
                    ->pluck('id', 'slug')
                    ->toArray();

                $serviceCount = rand(5, 10);
                $this->createServicesForShop($shop, $serviceCount);
            }
        }
    }

    protected function createServicesForShop(Shop $shop, int $count): void
    {
        $services = $this->getServiceTemplates($shop);

        $selectedServices = array_rand($services, min($count, count($services)));
        if (! is_array($selectedServices)) {
            $selectedServices = [$selectedServices];
        }

        foreach ($selectedServices as $key) {
            $template = $services[$key];

            $service = Service::create([
                'tenant_id' => $shop->tenant_id,
                'shop_id' => $shop->id,
                'service_category_id' => $this->getCategoryId($shop->tenant_id, $template['category']),
                'name' => $template['name'],
                'slug' => $this->generateSlug($template['name']),
                'description' => $template['description'] ?? null,
                'has_material_options' => $template['has_material_options'] ?? false,
                'is_active' => true,
                'is_available_online' => $template['is_available_online'] ?? true,
            ]);

            $this->createVariantsForService($service, $template);
            $this->createAddonsForService($service, $template);
            $this->createImagesForService($service);
        }
    }

    /**
     * Create placeholder images for a service
     */
    protected function createImagesForService(Service $service): void
    {
        $imageCount = rand(1, 3);

        for ($i = 0; $i < $imageCount; $i++) {
            Image::create([
                'tenant_id' => $service->tenant_id,
                'imageable_type' => Service::class,
                'imageable_id' => $service->id,
                'filename' => 'placeholder.jpg',
                'path' => 'https://placehold.co/600x400',
                'disk' => 'public',
                'mime_type' => 'image/jpeg',
                'size' => 0,
                'width' => 600,
                'height' => 400,
                'alt_text' => $service->name,
                'title' => $service->name,
                'caption' => $service->description,
                'is_primary' => $i === 0,
                'sort_order' => $i,
            ]);
        }
    }

    protected function createVariantsForService(Service $service, array $template): void
    {
        $variants = $template['variants'] ?? [];

        foreach ($variants as $variantData) {
            ServiceVariant::create([
                'service_id' => $service->id,
                'name' => $variantData['name'],
                'description' => $variantData['description'] ?? null,
                'customer_materials_price' => $variantData['customer_materials_price'] ?? null,
                'shop_materials_price' => $variantData['shop_materials_price'] ?? null,
                'base_price' => $variantData['base_price'],
                'estimated_duration_minutes' => $variantData['estimated_duration_minutes'] ?? null,
                'sort_order' => $variantData['sort_order'] ?? 0,
                'is_active' => true,
            ]);
        }
    }

    protected function createAddonsForService(Service $service, array $template): void
    {
        $addons = $template['addons'] ?? [];

        foreach ($addons as $addonData) {
            ServiceAddon::create([
                'service_id' => $service->id,
                'name' => $addonData['name'],
                'description' => $addonData['description'] ?? null,
                'price' => $addonData['price'],
                'allows_quantity' => $addonData['allows_quantity'] ?? false,
                'max_quantity' => $addonData['max_quantity'] ?? null,
                'sort_order' => $addonData['sort_order'] ?? 0,
                'is_active' => true,
            ]);
        }
    }

    protected function getServiceTemplates(Shop $shop): array
    {
        return [
            // Tailoring Services
            [
                'name' => 'Dress Tailoring',
                'category' => 'tailoring-alterations',
                'description' => 'Custom dress tailoring and alterations',
                'has_material_options' => true,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Simple Dress',
                        'description' => 'Basic dress alteration or custom tailoring',
                        'customer_materials_price' => 5000.00,
                        'shop_materials_price' => 12000.00,
                        'base_price' => 5000.00,
                        'estimated_duration_minutes' => 180,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Evening Gown',
                        'description' => 'Formal evening gown tailoring',
                        'customer_materials_price' => 15000.00,
                        'shop_materials_price' => 35000.00,
                        'base_price' => 15000.00,
                        'estimated_duration_minutes' => 480,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Express Service (24 hours)',
                        'description' => 'Rush delivery within 24 hours',
                        'price' => 5000.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Embroidery Design',
                        'description' => 'Custom embroidery pattern',
                        'price' => 3000.00,
                        'allows_quantity' => true,
                        'max_quantity' => 5,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Phone Repair Services
            [
                'name' => 'Phone Screen Replacement',
                'category' => 'repairs-maintenance',
                'description' => 'Professional phone screen repair service',
                'has_material_options' => true,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'iPhone 12/13',
                        'description' => 'Screen replacement for iPhone 12 or 13',
                        'customer_materials_price' => 5000.00,
                        'shop_materials_price' => 25000.00,
                        'base_price' => 5000.00,
                        'estimated_duration_minutes' => 60,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Samsung Galaxy S21/S22',
                        'description' => 'Screen replacement for Samsung Galaxy S21/S22',
                        'customer_materials_price' => 5000.00,
                        'shop_materials_price' => 22000.00,
                        'base_price' => 5000.00,
                        'estimated_duration_minutes' => 60,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Screen Protector Installation',
                        'description' => 'Tempered glass screen protector',
                        'price' => 2000.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Phone Case',
                        'description' => 'Protective phone case',
                        'price' => 3500.00,
                        'allows_quantity' => false,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Printing Services
            [
                'name' => 'Document Printing',
                'category' => 'printing-design',
                'description' => 'Black & white and color document printing',
                'has_material_options' => false,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Black & White (Per Page)',
                        'description' => 'Standard black and white printing',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 50.00,
                        'estimated_duration_minutes' => 1,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Color (Per Page)',
                        'description' => 'Full color printing',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 150.00,
                        'estimated_duration_minutes' => 1,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Binding (Spiral)',
                        'description' => 'Spiral binding for documents',
                        'price' => 500.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Lamination (Per Page)',
                        'description' => 'Document lamination',
                        'price' => 200.00,
                        'allows_quantity' => true,
                        'max_quantity' => 100,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Hair Services
            [
                'name' => 'Hair Styling',
                'category' => 'beauty-grooming',
                'description' => 'Professional hair styling services',
                'has_material_options' => false,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Basic Haircut',
                        'description' => 'Standard haircut and styling',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 3000.00,
                        'estimated_duration_minutes' => 45,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Hair Coloring',
                        'description' => 'Full hair color treatment',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 12000.00,
                        'estimated_duration_minutes' => 120,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Deep Conditioning Treatment',
                        'description' => 'Hair conditioning and treatment',
                        'price' => 4000.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Hair Wash',
                        'description' => 'Professional hair washing',
                        'price' => 1000.00,
                        'allows_quantity' => false,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Cleaning Services
            [
                'name' => 'Home Cleaning',
                'category' => 'cleaning-services',
                'description' => 'Professional home and office cleaning',
                'has_material_options' => true,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Basic Cleaning (1-2 Bedroom)',
                        'description' => 'Standard cleaning for small apartments',
                        'customer_materials_price' => 8000.00,
                        'shop_materials_price' => 15000.00,
                        'base_price' => 8000.00,
                        'estimated_duration_minutes' => 180,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Deep Cleaning (3+ Bedroom)',
                        'description' => 'Thorough deep cleaning for larger homes',
                        'customer_materials_price' => 15000.00,
                        'shop_materials_price' => 25000.00,
                        'base_price' => 15000.00,
                        'estimated_duration_minutes' => 300,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Window Cleaning',
                        'description' => 'Professional window cleaning',
                        'price' => 5000.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Carpet Cleaning (Per Room)',
                        'description' => 'Deep carpet cleaning service',
                        'price' => 3000.00,
                        'allows_quantity' => true,
                        'max_quantity' => 10,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Consulting Services
            [
                'name' => 'Business Consulting',
                'category' => 'consulting-professional',
                'description' => 'Professional business consulting and advisory',
                'has_material_options' => false,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Hourly Consultation',
                        'description' => 'One-on-one business consultation',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 25000.00,
                        'estimated_duration_minutes' => 60,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Full Day Workshop',
                        'description' => 'Comprehensive business workshop',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 150000.00,
                        'estimated_duration_minutes' => 480,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Written Report',
                        'description' => 'Detailed written analysis and recommendations',
                        'price' => 15000.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Follow-up Session',
                        'description' => '1-hour follow-up consultation',
                        'price' => 20000.00,
                        'allows_quantity' => true,
                        'max_quantity' => 5,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Installation Services
            [
                'name' => 'Air Conditioner Installation',
                'category' => 'installation-setup',
                'description' => 'Professional AC installation service',
                'has_material_options' => true,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Split AC (1HP - 1.5HP)',
                        'description' => 'Installation of split AC unit',
                        'customer_materials_price' => 15000.00,
                        'shop_materials_price' => 35000.00,
                        'base_price' => 15000.00,
                        'estimated_duration_minutes' => 240,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Window AC',
                        'description' => 'Installation of window AC unit',
                        'customer_materials_price' => 8000.00,
                        'shop_materials_price' => 20000.00,
                        'base_price' => 8000.00,
                        'estimated_duration_minutes' => 120,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Bracket Installation',
                        'description' => 'Heavy-duty mounting brackets',
                        'price' => 5000.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Copper Piping (Per Meter)',
                        'description' => 'Additional copper piping',
                        'price' => 2000.00,
                        'allows_quantity' => true,
                        'max_quantity' => 20,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Photography Services
            [
                'name' => 'Event Photography',
                'category' => 'photography-videography',
                'description' => 'Professional event photography services',
                'has_material_options' => false,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Half Day Coverage (4 hours)',
                        'description' => 'Professional photography for 4 hours',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 50000.00,
                        'estimated_duration_minutes' => 240,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Full Day Coverage (8 hours)',
                        'description' => 'Professional photography for full day',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 85000.00,
                        'estimated_duration_minutes' => 480,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Photo Album (50 pages)',
                        'description' => 'Printed photo album',
                        'price' => 25000.00,
                        'allows_quantity' => true,
                        'max_quantity' => 5,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Videography Add-on',
                        'description' => 'Video recording service',
                        'price' => 35000.00,
                        'allows_quantity' => false,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Laptop Repair
            [
                'name' => 'Laptop Repair & Servicing',
                'category' => 'repairs-maintenance',
                'description' => 'Computer repair and maintenance services',
                'has_material_options' => true,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Basic Diagnostics & Cleaning',
                        'description' => 'System checkup and cleaning',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 3000.00,
                        'estimated_duration_minutes' => 60,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Hardware Replacement',
                        'description' => 'Replace faulty hardware components',
                        'customer_materials_price' => 5000.00,
                        'shop_materials_price' => 15000.00,
                        'base_price' => 5000.00,
                        'estimated_duration_minutes' => 120,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Data Backup',
                        'description' => 'Full system data backup',
                        'price' => 3000.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Software Installation',
                        'description' => 'Install operating system and software',
                        'price' => 4000.00,
                        'allows_quantity' => false,
                        'sort_order' => 2,
                    ],
                ],
            ],

            // Custom Banner Printing
            [
                'name' => 'Banner & Signage Printing',
                'category' => 'printing-design',
                'description' => 'Large format printing for banners and signage',
                'has_material_options' => false,
                'is_available_online' => true,
                'variants' => [
                    [
                        'name' => 'Small Banner (2ft x 3ft)',
                        'description' => 'Vinyl banner printing',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 5000.00,
                        'estimated_duration_minutes' => 60,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Large Banner (4ft x 6ft)',
                        'description' => 'Large vinyl banner printing',
                        'customer_materials_price' => null,
                        'shop_materials_price' => null,
                        'base_price' => 12000.00,
                        'estimated_duration_minutes' => 120,
                        'sort_order' => 2,
                    ],
                ],
                'addons' => [
                    [
                        'name' => 'Grommets Installation',
                        'description' => 'Metal grommets for hanging',
                        'price' => 1000.00,
                        'allows_quantity' => false,
                        'sort_order' => 1,
                    ],
                    [
                        'name' => 'Wooden Frame',
                        'description' => 'Wooden mounting frame',
                        'price' => 5000.00,
                        'allows_quantity' => false,
                        'sort_order' => 2,
                    ],
                ],
            ],
        ];
    }

    protected function getCategoryId(int $tenantId, string $slug): ?int
    {
        return $this->categoryCache[$tenantId][$slug] ?? null;
    }

    protected function generateSlug(string $name): string
    {
        return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'))
            .'-'.substr(md5($name.microtime()), 0, 6);
    }
}
