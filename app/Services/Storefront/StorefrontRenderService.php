<?php

namespace App\Services\Storefront;

use App\Cache\StorefrontBuilderCache;
use App\Enums\StorefrontPageType;
use App\Models\Customer;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Services\CartService;

class StorefrontRenderService
{
    public function __construct(
        private readonly SectionTypeRegistry $registry,
        private readonly CartService $cartService,
        private readonly StorefrontBuilderCache $cache
    ) {}

    public function buildPage(Shop $shop, StorefrontPageType $pageType, ?string $slug = null, ?Customer $customer = null): array
    {
        $cached = $this->cache->page($shop, $pageType, $slug, function () use ($shop, $pageType, $slug) {
            $config = $this->loadConfig($shop);

            $page = StorefrontPage::query()
                ->where('tenant_id', $shop->tenant_id)
                ->where('shop_id', $shop->id)
                ->where('storefront_config_id', $config->id)
                ->where('page_type', $pageType)
                ->where('is_published', true)
                ->when($slug, fn ($q) => $q->where('slug', $slug))
                ->firstOrFail();

            $resolved = $this->cachedThemeConfig($shop, $config);
            $themeStyleVars = $this->buildThemeStyleVars($resolved);
            $themeStyles = $this->buildThemeStylesFromVars($themeStyleVars);
            $sections = $this->resolveSections($page->sections ?? [], $shop);
            $seo = $this->buildSeoMeta($page, $config);
            $navigation = $this->cachedNavigation($shop, $config);

            return [
                'shop' => $this->serializeShop($shop),
                'template' => $this->serializeTemplate($config),
                'theme' => $resolved,
                'themeStyles' => $themeStyles,
                'themeStyleVars' => $themeStyleVars,
                'sections' => $sections,
                'seo' => $seo,
                'navigation' => $navigation,
            ];
        });

        return array_merge($cached, [
            'cart' => $this->resolveCartSummary($shop, $customer),
            'customer' => $this->serializeCustomer($customer),
            'csrfToken' => csrf_token(),
        ]);
    }

    private const UNPUBLISH_SAFE_PAGES = ['login', 'register', 'forgot-password', 'reset-password', 'verify-email', 'cart', 'checkout'];

    public function buildFixedPage(Shop $shop, string $page, array $params = [], ?Customer $customer = null): array
    {
        $requirePublished = ! in_array($page, self::UNPUBLISH_SAFE_PAGES, true);
        $config = $this->loadConfig($shop, $requirePublished);
        $resolved = $this->cachedThemeConfig($shop, $config);
        $themeStyleVars = $this->buildThemeStyleVars($resolved);
        $themeStyles = $this->buildThemeStylesFromVars($themeStyleVars);
        $navigation = $this->cachedNavigation($shop, $config);
        $fixedPageData = $this->loadFixedPageData($shop, $page, $params, $customer);
        $seo = $this->buildFixedPageSeo($shop, $page, $config);

        return [
            'shop' => $this->serializeShop($shop),
            'template' => $this->serializeTemplate($config),
            'theme' => $resolved,
            'themeStyles' => $themeStyles,
            'themeStyleVars' => $themeStyleVars,
            'fixedPage' => $page,
            'fixedPageData' => $fixedPageData,
            'seo' => $seo,
            'cart' => $this->resolveCartSummary($shop, $customer),
            'navigation' => $navigation,
            'customer' => $this->serializeCustomer($customer),
            'csrfToken' => csrf_token(),
        ];
    }

    private function cachedThemeConfig(Shop $shop, StorefrontConfig $config): array
    {
        return $this->cache->config($shop, fn () => $this->resolveThemeConfig($config));
    }

    private function cachedNavigation(Shop $shop, StorefrontConfig $config): array
    {
        return $this->cache->navigation($shop, fn () => $this->buildNavigation($shop, $config));
    }

    public function resolveThemeConfig(StorefrontConfig $config): array
    {
        $config->loadMissing('theme');
        $themeConfig = $config->theme?->theme_config ?? [];

        $colors = $this->resolveColors($themeConfig, $config);
        $colorsDark = $this->resolveColorsDark($themeConfig, $config);
        $typography = $this->resolveTypography($themeConfig, $config);
        $components = array_merge($themeConfig['components'] ?? [], $config->component_overrides ?? []);
        $feel = array_merge($themeConfig['feel'] ?? [], $config->feel_overrides ?? []);
        $animation = array_merge($themeConfig['animation'] ?? [], $config->animation_overrides ?? []);
        $header = array_merge($themeConfig['header'] ?? [], $config->header_overrides ?? []);
        $footer = array_merge($themeConfig['footer'] ?? [], $config->footer_overrides ?? []);

        return [
            'colors' => $colors,
            'colors_dark' => $colorsDark,
            'dark_mode_enabled' => (bool) $config->dark_mode_enabled,
            'dark_mode_strategy' => $config->dark_mode_strategy ?? 'system',
            'typography' => $typography,
            'components' => $components,
            'feel' => $feel,
            'animation' => $animation,
            'header' => $header,
            'footer' => $footer,
            'hero' => $themeConfig['hero'] ?? [],
            'product_card' => $themeConfig['product_card'] ?? [],
            'decorations' => $themeConfig['decorations'] ?? [],
        ];
    }

    public function buildThemeStyles(array $resolved): string
    {
        return $this->buildThemeStylesFromVars($this->buildThemeStyleVars($resolved));
    }

    private function buildThemeStylesFromVars(array $vars): string
    {
        $parts = [];
        foreach ($vars as $key => $value) {
            $parts[] = "{$key}: {$value}";
        }

        return implode('; ', $parts);
    }

    public function buildThemeStyleVars(array $resolved): array
    {
        $vars = [];

        foreach ($resolved['colors'] ?? [] as $key => $value) {
            $safeKey = preg_replace('/[^a-zA-Z0-9_-]/', '', $key);
            $vars["--color-{$safeKey}"] = $this->sanitizeCssValue($value);
        }

        if (isset($resolved['typography']['heading_font'])) {
            $vars['--font-heading'] = '"'.$this->sanitizeCssValue($resolved['typography']['heading_font']).'"';
        }
        if (isset($resolved['typography']['body_font'])) {
            $vars['--font-body'] = '"'.$this->sanitizeCssValue($resolved['typography']['body_font']).'"';
        }
        if (isset($resolved['typography']['base_size'])) {
            $vars['--font-base-size'] = $this->sanitizeCssValue((string) $resolved['typography']['base_size']).'px';
        }
        if (isset($resolved['typography']['line_height'])) {
            $vars['--line-height'] = $this->sanitizeCssValue((string) $resolved['typography']['line_height']);
        }

        if (isset($resolved['feel']['border_radius'])) {
            $vars['--radius'] = $this->sanitizeCssValue($resolved['feel']['border_radius']);
        }
        if (isset($resolved['feel']['section_spacing'])) {
            $vars['--section-spacing'] = $this->sanitizeCssValue($resolved['feel']['section_spacing']);
        }
        if (isset($resolved['feel']['shadow_depth'])) {
            $vars['--shadow-depth'] = $this->sanitizeCssValue($resolved['feel']['shadow_depth']);
        }

        return $vars;
    }

    private function sanitizeCssValue(string $value): string
    {
        $value = str_replace(['<', '>', '{', '}', '\\', '/*', '*/', ';'], '', $value);

        $value = preg_replace('/url\s*\(/i', '', $value);
        $value = preg_replace('/expression\s*\(/i', '', $value);
        $value = preg_replace('/javascript\s*:/i', '', $value);
        $value = preg_replace('/@import/i', '', $value);

        return $value;
    }

    public function resolveSections(array $sections, Shop $shop): array
    {
        return array_values(array_map(function (array $section, int $index) use ($shop) {
            $type = $section['type'] ?? '';
            $config = $section['config'] ?? [];
            $config['shop_slug'] = $shop->slug;
            $config['currency_symbol'] = $shop->currency_symbol ?? '₦';
            $config['currency_decimals'] = $shop->currency_decimals ?? 2;
            $data = $this->registry->resolveData($type, $config, $shop);

            return [
                'id' => $section['id'] ?? 'section-'.$type.'-'.$index,
                'type' => $type,
                'variant' => $section['variant'] ?? 'default',
                'is_visible' => $section['is_visible'] ?? true,
                'scroll_animation' => $section['scroll_animation'] ?? 'none',
                'config' => $config,
                'data' => $data,
            ];
        }, $sections, array_keys($sections)));
    }

    private function resolveColors(array $themeConfig, StorefrontConfig $config): array
    {
        $presets = $themeConfig['palette']['presets'] ?? [];
        $presetName = $config->color_preset;

        $colors = [];

        if ($presetName && ! empty($presets)) {
            foreach ($presets as $preset) {
                if (($preset['name'] ?? '') === $presetName) {
                    $colors = collect($preset)->except('name')->all();
                    break;
                }
            }
        }

        if (empty($colors) && ! empty($presets)) {
            $first = $presets[0] ?? [];
            $colors = collect($first)->except('name')->all();
        }

        if (empty($colors)) {
            $colors = $themeConfig['colors'] ?? [];
        }

        if (! empty($config->color_overrides)) {
            $colors = array_merge($colors, $config->color_overrides);
        }

        return $colors;
    }

    private function resolveColorsDark(array $themeConfig, StorefrontConfig $config): array
    {
        if (! $config->dark_mode_enabled) {
            return [];
        }

        $presets = $themeConfig['palette_dark']['presets'] ?? [];
        $presetName = $config->color_preset_dark;

        $colors = [];

        if ($presetName && ! empty($presets)) {
            foreach ($presets as $preset) {
                if (($preset['name'] ?? '') === $presetName) {
                    $colors = collect($preset)->except('name')->all();
                    break;
                }
            }
        }

        if (empty($colors) && ! empty($presets)) {
            $first = $presets[0] ?? [];
            $colors = collect($first)->except('name')->all();
        }

        if (empty($colors)) {
            $colors = $themeConfig['colors_dark'] ?? [];
        }

        if (! empty($config->color_overrides_dark)) {
            $colors = array_merge($colors, $config->color_overrides_dark);
        }

        return $colors;
    }

    private function resolveTypography(array $themeConfig, StorefrontConfig $config): array
    {
        $options = $themeConfig['typography']['options'] ?? [];
        $presetName = $config->typography_preset;

        $typography = [
            'heading_font' => $themeConfig['typography']['heading_font'] ?? 'Inter',
            'body_font' => $themeConfig['typography']['body_font'] ?? 'Inter',
            'heading_weight' => $themeConfig['typography']['heading_weight'] ?? '700',
            'body_weight' => $themeConfig['typography']['body_weight'] ?? '400',
            'base_size' => $themeConfig['typography']['base_size'] ?? 16,
            'line_height' => $themeConfig['typography']['line_height'] ?? 1.6,
        ];

        if ($presetName && ! empty($options)) {
            foreach ($options as $option) {
                if (($option['name'] ?? '') === $presetName) {
                    $typography = array_merge($typography, collect($option)->except('name')->all());
                    break;
                }
            }
        } elseif (! empty($options)) {
            $first = $options[0] ?? [];
            $typography = array_merge($typography, collect($first)->except('name')->all());
        }

        if (! empty($config->typography_overrides)) {
            $typography = array_merge($typography, $config->typography_overrides);
        }

        return $typography;
    }

    private function loadConfig(Shop $shop, bool $requirePublished = true): StorefrontConfig
    {
        $shop->load('storefrontConfig.theme');

        $config = $shop->storefrontConfig;

        if ($config === null) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Storefront config not found.');
        }

        if ($requirePublished && ! $config->is_published) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Storefront is not published.');
        }

        return $config;
    }

    private function serializeShop(Shop $shop): array
    {
        return [
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'currency' => $shop->currency,
            'currency_symbol' => $shop->currency_symbol,
            'currency_decimals' => $shop->currency_decimals,
            'logo' => $shop->storefrontConfig?->logo_path,
            'favicon' => $shop->storefrontConfig?->favicon_path,
        ];
    }

    private function buildNavigation(Shop $shop, StorefrontConfig $config): array
    {
        $pages = StorefrontPage::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('storefront_config_id', $config->id)
            ->where('is_published', true)
            ->orderBy('sort_order')
            ->get(['page_type', 'slug', 'title']);

        $items = [];

        foreach ($pages as $page) {
            $items[] = [
                'label' => $page->title,
                'page_type' => $page->page_type->value,
                'slug' => $page->slug,
            ];
        }

        return [
            'items' => $items,
            'announcement' => $config->global_announcement,
            'social_links' => $config->social_links,
        ];
    }

    private function buildSeoMeta(StorefrontPage $page, StorefrontConfig $config): array
    {
        $defaults = $config->seo_defaults ?? [];
        $suffix = $defaults['title_suffix'] ?? '';

        return [
            'title' => $page->seo_title ?? ($page->title.$suffix),
            'description' => $page->seo_description ?? ($defaults['description'] ?? ''),
            'image' => $page->seo_image_path ?? ($defaults['image'] ?? null),
        ];
    }

    private function buildFixedPageSeo(Shop $shop, string $page, StorefrontConfig $config): array
    {
        $defaults = $config->seo_defaults ?? [];
        $suffix = $defaults['title_suffix'] ?? '';

        $titles = [
            'cart' => 'Shopping Cart',
            'checkout' => 'Checkout',
            'login' => 'Sign In',
            'register' => 'Create Account',
            'forgot-password' => 'Forgot Password',
            'reset-password' => 'Reset Password',
            'verify-email' => 'Verify Email',
            'account-dashboard' => 'My Account',
            'account-orders' => 'My Orders',
            'account-order-detail' => 'Order Details',
            'account-profile' => 'My Profile',
            'services' => 'Services',
            'service-detail' => 'Service Details',
            'product-detail' => 'Product Details',
            'checkout-success' => 'Order Confirmed',
            'checkout-pending' => 'Payment Pending',
        ];

        $title = ($titles[$page] ?? ucfirst(str_replace('-', ' ', $page))).$suffix;

        return [
            'title' => $title,
            'description' => $defaults['description'] ?? '',
            'image' => $defaults['image'] ?? null,
        ];
    }

    private function loadFixedPageData(Shop $shop, string $page, array $params, ?Customer $customer): array
    {
        return match ($page) {
            'cart' => $this->loadCartData($shop, $customer),
            'login' => $this->loadLoginData($shop),
            'register' => $this->loadRegisterData($shop),
            'forgot-password', 'verify-email' => $this->loadAuthPageData($shop),
            'reset-password' => $this->loadResetPasswordData($shop, $params),
            'checkout' => $this->loadCheckoutData($shop, $customer),
            'checkout-success', 'checkout-pending' => $this->loadOrderStatusData($params),
            'account-dashboard' => $this->loadAccountDashboardData($shop, $customer),
            'account-orders' => $this->loadAccountOrdersData($shop, $customer),
            'account-order-detail' => $this->loadAccountOrderDetailData($shop, $params),
            'account-profile' => $this->loadAccountProfileData($customer),
            'services' => $this->loadServicesData($shop),
            'service-detail' => $this->loadServiceDetailData($shop, $params),
            'product-detail' => $this->loadProductDetailData($shop, $params),
            default => [],
        };
    }

    private function loadCartData(Shop $shop, ?Customer $customer): array
    {
        $customerId = $customer?->id;
        $cart = $this->cartService->getCart($shop, $customerId);
        $cart->load([
            'items.productVariant.product',
            'items.packagingType',
            'items.sellable',
        ]);
        $summary = $this->cartService->getCartSummary($cart);

        return [
            'items' => $cart->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->productVariant?->product?->name ?? $item->sellable?->name ?? '',
                'variant_name' => $item->productVariant?->name,
                'price' => (float) $item->price,
                'quantity' => $item->quantity,
                'image' => $item->productVariant?->product?->primary_image_url ?? null,
                'max_quantity' => $item->productVariant?->stock_quantity,
            ])->all(),
            'summary' => [
                'subtotal' => $summary['subtotal'],
                'shipping_fee' => $summary['shipping_fee'],
                'tax' => $summary['tax'],
                'total' => $summary['total'],
                'item_count' => $summary['item_count'],
            ],
        ];
    }

    private function loadLoginData(Shop $shop): array
    {
        return [
            'shop_name' => $shop->name,
            'registration_enabled' => $shop->storefront_settings['registration_enabled'] ?? true,
        ];
    }

    private function loadRegisterData(Shop $shop): array
    {
        return [
            'shop_name' => $shop->name,
        ];
    }

    private function loadAuthPageData(Shop $shop): array
    {
        return [
            'shop_name' => $shop->name,
        ];
    }

    private function loadResetPasswordData(Shop $shop, array $params): array
    {
        return [
            'shop_name' => $shop->name,
            'token' => $params['token'] ?? '',
            'email' => request('email', ''),
        ];
    }

    private function loadCheckoutData(Shop $shop, ?Customer $customer): array
    {
        $customerId = $customer?->id;
        $cart = $this->cartService->getCart($shop, $customerId);
        $cart->load(['items.productVariant.product', 'items.sellable']);
        $summary = $this->cartService->getCartSummary($cart);

        return [
            'items' => $cart->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->productVariant?->product?->name ?? $item->sellable?->name ?? '',
                'variant_name' => $item->productVariant?->name,
                'price' => (float) $item->price,
                'quantity' => $item->quantity,
                'image' => $item->productVariant?->product?->primary_image_url ?? null,
                'max_quantity' => $item->productVariant?->stock_quantity,
            ])->all(),
            'summary' => [
                'subtotal' => $summary['subtotal'],
                'shipping_fee' => $summary['shipping_fee'],
                'tax' => $summary['tax'],
                'total' => $summary['total'],
                'item_count' => $summary['item_count'],
            ],
            'payment_methods' => $shop->storefront_settings['payment_methods'] ?? ['paystack'],
        ];
    }

    private function loadOrderStatusData(array $params): array
    {
        $order = $params['order'] ?? null;

        if (! $order) {
            return ['order' => null];
        }

        $order->load(['items.productVariant.product', 'payments']);

        return [
            'order' => $this->serializeOrder($order),
        ];
    }

    private function loadAccountDashboardData(Shop $shop, ?Customer $customer): array
    {
        if (! $customer) {
            return ['stats' => ['total_orders' => 0, 'total_spent' => 0.0], 'recent_orders' => []];
        }

        $orderQuery = $customer->orders()
            ->where('shop_id', $shop->id)
            ->where('order_type', \App\Enums\OrderType::CUSTOMER->value);

        $stats = (clone $orderQuery)
            ->selectRaw('COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent')
            ->first();

        $recentOrders = (clone $orderQuery)
            ->with('items')
            ->latest()
            ->limit(5)
            ->get();

        return [
            'stats' => [
                'total_orders' => (int) $stats->total_orders,
                'total_spent' => (float) $stats->total_spent,
            ],
            'recent_orders' => $recentOrders->map(fn ($order) => $this->serializeOrder($order))->all(),
        ];
    }

    private function loadAccountOrdersData(Shop $shop, ?Customer $customer): array
    {
        if (! $customer) {
            return ['orders' => ['data' => [], 'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 10, 'total' => 0]]];
        }

        $paginator = $customer->orders()
            ->where('shop_id', $shop->id)
            ->where('order_type', \App\Enums\OrderType::CUSTOMER->value)
            ->with('items')
            ->latest()
            ->paginate(10);

        return [
            'orders' => [
                'data' => collect($paginator->items())->map(fn ($order) => $this->serializeOrder($order))->all(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ];
    }

    private function loadAccountOrderDetailData(Shop $shop, array $params): array
    {
        $order = $params['order'] ?? null;

        if (! $order) {
            return ['order' => null];
        }

        $order->load(['items.productVariant.product', 'payments']);

        return [
            'order' => $this->serializeOrder($order),
        ];
    }

    private function loadAccountProfileData(?Customer $customer): array
    {
        if (! $customer) {
            return ['customer' => null];
        }

        return [
            'customer' => [
                'id' => $customer->id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
            ],
        ];
    }

    private function loadServicesData(Shop $shop): array
    {
        $services = \App\Models\Service::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('is_active', true)
            ->with(['variants', 'category'])
            ->get();

        return [
            'services' => $services->map(fn ($service) => $this->serializeService($service))->all(),
        ];
    }

    private function loadServiceDetailData(Shop $shop, array $params): array
    {
        $slug = $params['slug'] ?? null;

        if (! $slug) {
            return ['service' => null];
        }

        $service = \App\Models\Service::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with(['variants', 'category', 'addons'])
            ->firstOrFail();

        return [
            'service' => $this->serializeService($service),
        ];
    }

    private function loadProductDetailData(Shop $shop, array $params): array
    {
        $slug = $params['slug'] ?? null;

        if (! $slug) {
            return ['product' => null];
        }

        $product = \App\Models\Product::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with([
                'variants' => fn ($q) => $q->where('is_active', true)->where('is_available_online', true),
                'category',
                'images',
            ])
            ->firstOrFail();

        return [
            'product' => $this->serializeProductDetail($product),
        ];
    }

    private function serializeProductDetail(\App\Models\Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'category_name' => $product->category?->name,
            'is_new' => $product->created_at?->isAfter(now()->subDays(14)) ?? false,
            'images' => $product->relationLoaded('images')
                ? $product->images->map(fn ($image) => [
                    'id' => $image->id,
                    'url' => $image->url ?? null,
                    'alt' => $image->alt_text ?? null,
                ])->all()
                : [],
            'variants' => $product->relationLoaded('variants')
                ? $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'sku' => $variant->sku,
                    'price' => (float) $variant->price,
                    'compare_at_price' => $variant->compare_at_price ? (float) $variant->compare_at_price : null,
                    'stock_quantity' => $variant->available_stock ?? null,
                    'is_active' => $variant->is_active,
                ])->all()
                : [],
        ];
    }

    private function serializeService(\App\Models\Service $service): array
    {
        return [
            'id' => $service->id,
            'name' => $service->name,
            'slug' => $service->slug,
            'description' => $service->description,
            'category_name' => $service->category?->name,
            'is_active' => $service->is_active,
            'variants' => $service->relationLoaded('variants')
                ? $service->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'price' => (float) $variant->price,
                    'duration_minutes' => $variant->duration_minutes,
                    'is_active' => $variant->is_active,
                ])->all()
                : [],
            'addons' => $service->relationLoaded('addons')
                ? $service->addons->map(fn ($addon) => [
                    'id' => $addon->id,
                    'name' => $addon->name,
                    'price' => (float) $addon->price,
                ])->all()
                : [],
        ];
    }

    private function serializeTemplate(StorefrontConfig $config): array
    {
        $config->loadMissing('theme.template');
        $template = $config->theme?->template;

        return [
            'slug' => $template?->slug ?? 'classic-commerce',
            'animation_tier' => $template?->animation_tier?->value ?? 'subtle',
            'structural_config' => $template?->structural_config ?? [],
        ];
    }

    private function resolveCartSummary(Shop $shop, ?Customer $customer): array
    {
        $customerId = $customer?->id;
        $cart = $this->cartService->getCart($shop, $customerId);
        $summary = $this->cartService->getCartSummary($cart);

        return [
            'item_count' => $summary['item_count'] ?? 0,
            'subtotal' => $summary['subtotal'] ?? 0,
            'total' => $summary['total'] ?? 0,
        ];
    }

    private function serializeOrder(\App\Models\Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status?->value ?? $order->status,
            'subtotal' => (float) $order->subtotal,
            'tax' => (float) $order->tax_amount,
            'total' => (float) $order->total_amount,
            'created_at' => $order->created_at?->toISOString() ?? '',
            'items' => $order->relationLoaded('items')
                ? $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->productVariant?->product?->name ?? $item->product_name ?? '',
                    'variant_name' => $item->productVariant?->name ?? $item->variant_name ?? null,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total' => (float) $item->total_amount,
                    'image' => $item->productVariant?->product?->primary_image_url ?? null,
                ])->all()
                : [],
            'payments' => $order->relationLoaded('payments')
                ? $order->payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'method' => $payment->payment_method,
                    'amount' => (float) $payment->amount,
                    'status' => $payment->status?->value ?? $payment->status,
                ])->all()
                : [],
        ];
    }

    private function serializeCustomer(?Customer $customer): ?array
    {
        if (! $customer) {
            return null;
        }

        return [
            'id' => $customer->id,
            'name' => $customer->full_name,
            'email' => $customer->email,
        ];
    }
}
