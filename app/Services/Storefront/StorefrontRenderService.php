<?php

namespace App\Services\Storefront;

use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Services\CartService;

class StorefrontRenderService
{
    public function __construct(
        private readonly SectionTypeRegistry $registry,
        private readonly CartService $cartService
    ) {}

    public function buildPage(Shop $shop, StorefrontPageType $pageType, ?string $slug = null): array
    {
        $config = $this->loadConfig($shop);

        $page = StorefrontPage::query()
            ->where('shop_id', $shop->id)
            ->where('storefront_config_id', $config->id)
            ->where('page_type', $pageType)
            ->when($slug, fn ($q) => $q->where('slug', $slug))
            ->firstOrFail();

        $resolved = $this->resolveThemeConfig($config);
        $themeStyles = $this->buildThemeStyles($resolved);
        $sections = $this->resolveSections($page->sections ?? [], $shop);
        $seo = $this->buildSeoMeta($page, $config);
        $navigation = $this->buildNavigation($shop, $config);

        return [
            'shop' => $this->serializeShop($shop),
            'theme' => $resolved,
            'themeStyles' => $themeStyles,
            'sections' => $sections,
            'seo' => $seo,
            'navigation' => $navigation,
            'customer' => $this->resolveCustomer(),
            'csrfToken' => csrf_token(),
        ];
    }

    public function buildFixedPage(Shop $shop, string $page, array $params = []): array
    {
        $config = $this->loadConfig($shop);
        $resolved = $this->resolveThemeConfig($config);
        $themeStyles = $this->buildThemeStyles($resolved);
        $navigation = $this->buildNavigation($shop, $config);
        $fixedPageData = $this->loadFixedPageData($shop, $page, $params);
        $seo = $this->buildFixedPageSeo($shop, $page, $config);

        return [
            'shop' => $this->serializeShop($shop),
            'theme' => $resolved,
            'themeStyles' => $themeStyles,
            'fixedPage' => $page,
            'fixedPageData' => $fixedPageData,
            'seo' => $seo,
            'navigation' => $navigation,
            'customer' => $this->resolveCustomer(),
            'csrfToken' => csrf_token(),
        ];
    }

    public function resolveThemeConfig(StorefrontConfig $config): array
    {
        $config->loadMissing('theme');
        $themeConfig = $config->theme->theme_config ?? [];

        $colors = $this->resolveColors($themeConfig, $config);
        $typography = $this->resolveTypography($themeConfig, $config);
        $components = array_merge($themeConfig['components'] ?? [], $config->component_overrides ?? []);
        $feel = array_merge($themeConfig['feel'] ?? [], $config->feel_overrides ?? []);
        $animation = array_merge($themeConfig['animation'] ?? [], $config->animation_overrides ?? []);
        $header = array_merge($themeConfig['header'] ?? [], $config->header_overrides ?? []);
        $footer = array_merge($themeConfig['footer'] ?? [], $config->footer_overrides ?? []);

        return [
            'colors' => $colors,
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
        $vars = [];

        foreach ($resolved['colors'] ?? [] as $key => $value) {
            $vars[] = "--color-{$key}: {$value}";
        }

        if (isset($resolved['typography']['heading_font'])) {
            $vars[] = '--font-heading: "'.$resolved['typography']['heading_font'].'"';
        }
        if (isset($resolved['typography']['body_font'])) {
            $vars[] = '--font-body: "'.$resolved['typography']['body_font'].'"';
        }
        if (isset($resolved['typography']['base_size'])) {
            $vars[] = '--font-base-size: '.$resolved['typography']['base_size'].'px';
        }
        if (isset($resolved['typography']['line_height'])) {
            $vars[] = '--line-height: '.$resolved['typography']['line_height'];
        }

        if (isset($resolved['feel']['border_radius'])) {
            $vars[] = '--radius: '.$resolved['feel']['border_radius'];
        }
        if (isset($resolved['feel']['section_spacing'])) {
            $vars[] = '--section-spacing: '.$resolved['feel']['section_spacing'];
        }
        if (isset($resolved['feel']['shadow_depth'])) {
            $vars[] = '--shadow-depth: '.$resolved['feel']['shadow_depth'];
        }

        return implode('; ', $vars);
    }

    public function resolveSections(array $sections, Shop $shop): array
    {
        return array_map(function (array $section) use ($shop) {
            $type = $section['type'] ?? '';
            $config = $section['config'] ?? [];
            $data = $this->registry->resolveData($type, $config, $shop);

            return [
                'type' => $type,
                'config' => $config,
                'data' => $data,
            ];
        }, $sections);
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

    private function loadConfig(Shop $shop): StorefrontConfig
    {
        $shop->loadMissing('storefrontConfig.theme');

        return $shop->storefrontConfig;
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

    private function loadFixedPageData(Shop $shop, string $page, array $params): array
    {
        return match ($page) {
            'cart' => $this->loadCartData($shop),
            'login' => $this->loadLoginData($shop),
            'register' => $this->loadRegisterData($shop),
            'forgot-password', 'reset-password', 'verify-email' => $this->loadAuthPageData($shop),
            'checkout' => $this->loadCheckoutData($shop),
            'checkout-success', 'checkout-pending' => $this->loadOrderStatusData($params),
            'account-dashboard' => $this->loadAccountDashboardData($shop),
            'account-orders' => $this->loadAccountOrdersData($shop),
            'account-order-detail' => $this->loadAccountOrderDetailData($shop, $params),
            'account-profile' => $this->loadAccountProfileData(),
            'services' => $this->loadServicesData($shop),
            'service-detail' => $this->loadServiceDetailData($shop, $params),
            default => [],
        };
    }

    private function loadCartData(Shop $shop): array
    {
        $customerId = auth('customer')->id();
        $cart = $this->cartService->getCart($shop, $customerId);
        $cart->load([
            'items.productVariant.product',
            'items.packagingType',
            'items.sellable',
        ]);
        $summary = $this->cartService->getCartSummary($cart);

        return [
            'cart' => $cart,
            'summary' => $summary,
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

    private function loadCheckoutData(Shop $shop): array
    {
        $customerId = auth('customer')->id();
        $cart = $this->cartService->getCart($shop, $customerId);
        $summary = $this->cartService->getCartSummary($cart);

        return [
            'cart' => $cart->load(['items.productVariant.product', 'items.sellable']),
            'summary' => $summary,
            'payment_methods' => $shop->storefront_settings['payment_methods'] ?? ['paystack'],
        ];
    }

    private function loadOrderStatusData(array $params): array
    {
        return [
            'order' => $params['order'] ?? null,
        ];
    }

    private function loadAccountDashboardData(Shop $shop): array
    {
        $customer = auth('customer')->user();

        if (! $customer) {
            return [];
        }

        return [
            'stats' => [
                'total_orders' => $customer->orders()->where('shop_id', $shop->id)->count(),
                'total_spent' => (float) $customer->orders()->where('shop_id', $shop->id)->sum('total'),
            ],
            'recent_orders' => $customer->orders()
                ->where('shop_id', $shop->id)
                ->with('items')
                ->latest()
                ->limit(5)
                ->get(),
        ];
    }

    private function loadAccountOrdersData(Shop $shop): array
    {
        $customer = auth('customer')->user();

        if (! $customer) {
            return ['orders' => []];
        }

        return [
            'orders' => $customer->orders()
                ->where('shop_id', $shop->id)
                ->with('items')
                ->latest()
                ->paginate(10),
        ];
    }

    private function loadAccountOrderDetailData(Shop $shop, array $params): array
    {
        return [
            'order' => $params['order'] ?? null,
        ];
    }

    private function loadAccountProfileData(): array
    {
        $customer = auth('customer')->user();

        return [
            'customer' => $customer,
        ];
    }

    private function loadServicesData(Shop $shop): array
    {
        return [
            'services' => \App\Models\Service::query()
                ->where('tenant_id', $shop->tenant_id)
                ->where('shop_id', $shop->id)
                ->where('is_active', true)
                ->with(['variants', 'category'])
                ->get(),
        ];
    }

    private function loadServiceDetailData(Shop $shop, array $params): array
    {
        $slug = $params['slug'] ?? null;

        if (! $slug) {
            return [];
        }

        $service = \App\Models\Service::query()
            ->where('tenant_id', $shop->tenant_id)
            ->where('shop_id', $shop->id)
            ->where('slug', $slug)
            ->with(['variants', 'category', 'addons'])
            ->first();

        return [
            'service' => $service,
        ];
    }

    private function resolveCustomer(): ?array
    {
        $customer = auth('customer')->user();

        if (! $customer) {
            return null;
        }

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
        ];
    }
}
