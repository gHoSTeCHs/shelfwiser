<?php

namespace App\Services\Storefront;

use App\Cache\StorefrontBuilderCache;
use App\Enums\StorefrontPageType;
use App\Models\Shop;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontTheme;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StorefrontBuilderService
{
    public function __construct(
        private readonly StorefrontBuilderCache $cache
    ) {}

    public function getActiveThemes(): Collection
    {
        return StorefrontTheme::query()
            ->where('is_active', true)
            ->with('template')
            ->get();
    }

    public function findTheme(string $themeId): ?StorefrontTheme
    {
        return StorefrontTheme::query()->find($themeId);
    }

    public function getPageByType(Shop $shop, StorefrontPageType $type): StorefrontPage
    {
        return StorefrontPage::query()
            ->where('shop_id', $shop->id)
            ->where('page_type', $type)
            ->firstOrFail();
    }

    public function resolveConfigPage(StorefrontConfig $config, StorefrontPageType $type): StorefrontPage
    {
        return StorefrontPage::query()
            ->where('shop_id', $config->shop_id)
            ->where('storefront_config_id', $config->id)
            ->where('page_type', $type)
            ->firstOrFail();
    }

    public function updateStorefrontConfig(StorefrontConfig $config, array $validated): StorefrontConfig
    {
        $config->update($validated);

        return $config->fresh(['theme.template']);
    }

    public function initializeStorefront(Shop $shop, StorefrontTheme $theme): StorefrontConfig
    {
        return DB::transaction(function () use ($shop, $theme) {
            $config = StorefrontConfig::query()->firstOrCreate(
                ['shop_id' => $shop->id, 'tenant_id' => $shop->tenant_id],
                [
                    'theme_id' => $theme->id,
                    'is_published' => false,
                ]
            );

            if (! $config->wasRecentlyCreated) {
                $config->update(['theme_id' => $theme->id]);
            }

            $supportedPages = $theme->template->supported_pages ?? [];
            $defaultSections = $theme->default_sections ?? [];

            $fixedPageTypes = [
                StorefrontPageType::CART,
                StorefrontPageType::CHECKOUT,
                StorefrontPageType::PRODUCT_DETAIL,
            ];

            foreach ($supportedPages as $pageTypeValue) {
                $pageType = StorefrontPageType::tryFrom($pageTypeValue);

                if (! $pageType || in_array($pageType, $fixedPageTypes, true)) {
                    continue;
                }

                $isHome = $pageType === StorefrontPageType::HOME;

                $page = StorefrontPage::query()->firstOrCreate(
                    [
                        'shop_id' => $shop->id,
                        'page_type' => $pageType,
                        'tenant_id' => $shop->tenant_id,
                    ],
                    [
                        'storefront_config_id' => $config->id,
                        'slug' => $pageType->value,
                        'title' => $pageType->label(),
                        'sections' => $isHome ? $this->prepareSections($defaultSections) : [],
                        'is_published' => true,
                        'sort_order' => $this->getPageSortOrder($pageType),
                    ]
                );

                if (! $page->wasRecentlyCreated) {
                    $page->update(['storefront_config_id' => $config->id]);
                }
            }

            $this->cache->invalidateShop($shop);

            return $config;
        });
    }

    public function addSectionToPage(StorefrontPage $page, string $type, string $variant, ?int $position = null): StorefrontPage
    {
        $sections = $page->sections;

        $newSection = [
            'id' => $this->generateSectionId(),
            'type' => $type,
            'variant' => $variant,
            'is_visible' => true,
            'config' => [],
        ];

        if ($position !== null) {
            if ($position < 0 || $position > count($sections)) {
                throw new \InvalidArgumentException("Position {$position} is out of bounds.");
            }
            array_splice($sections, $position, 0, [$newSection]);
        } else {
            $sections[] = $newSection;
        }

        $page->update(['sections' => $sections]);
        $this->invalidatePageShop($page);

        return $page;
    }

    public function updateSectionConfig(StorefrontPage $page, string $sectionId, array $config, ?string $variant = null): StorefrontPage
    {
        $sections = $page->sections;
        $found = false;

        foreach ($sections as &$section) {
            if ($section['id'] === $sectionId) {
                $section['config'] = array_merge($section['config'] ?? [], $config);

                if ($variant !== null) {
                    $section['variant'] = $variant;
                }

                $found = true;
                break;
            }
        }
        unset($section);

        if (! $found) {
            throw new \InvalidArgumentException("Section with ID '{$sectionId}' not found on this page.");
        }

        $page->update(['sections' => $sections]);
        $this->invalidatePageShop($page);

        return $page;
    }

    public function removeSectionFromPage(StorefrontPage $page, string $sectionId): StorefrontPage
    {
        $sections = $page->sections;
        $originalCount = count($sections);

        $sections = array_values(array_filter($sections, fn (array $s) => $s['id'] !== $sectionId));

        if (count($sections) === $originalCount) {
            throw new \InvalidArgumentException("Section with ID '{$sectionId}' not found on this page.");
        }

        $page->update(['sections' => $sections]);
        $this->invalidatePageShop($page);

        return $page;
    }

    public function reorderSections(StorefrontPage $page, array $sectionIds): StorefrontPage
    {
        $sections = $page->sections;
        $existingIds = array_column($sections, 'id');

        if (count($sectionIds) !== count($existingIds) || array_diff($sectionIds, $existingIds) || array_diff($existingIds, $sectionIds)) {
            throw new \InvalidArgumentException('Section IDs do not match the existing sections on this page.');
        }

        $indexed = [];
        foreach ($sections as $section) {
            $indexed[$section['id']] = $section;
        }

        $reordered = [];
        foreach ($sectionIds as $id) {
            $reordered[] = $indexed[$id];
        }

        $page->update(['sections' => $reordered]);
        $this->invalidatePageShop($page);

        return $page;
    }

    public function toggleSectionVisibility(StorefrontPage $page, string $sectionId): StorefrontPage
    {
        $sections = $page->sections;
        $found = false;

        foreach ($sections as &$section) {
            if ($section['id'] === $sectionId) {
                $section['is_visible'] = ! ($section['is_visible'] ?? true);
                $found = true;
                break;
            }
        }
        unset($section);

        if (! $found) {
            throw new \InvalidArgumentException("Section with ID '{$sectionId}' not found on this page.");
        }

        $page->update(['sections' => $sections]);
        $this->invalidatePageShop($page);

        return $page;
    }

    public function publish(StorefrontConfig $config): StorefrontConfig
    {
        $config->update([
            'is_published' => true,
            'published_at' => now(),
        ]);

        $this->invalidateConfigShop($config);

        return $config;
    }

    public function unpublish(StorefrontConfig $config): StorefrontConfig
    {
        $config->update([
            'is_published' => false,
            'published_at' => null,
        ]);

        $this->invalidateConfigShop($config);

        return $config;
    }

    public function resetToThemeDefaults(StorefrontConfig $config): StorefrontConfig
    {
        $config->update([
            'color_preset' => null,
            'color_overrides' => null,
            'typography_preset' => null,
            'typography_overrides' => null,
            'component_overrides' => null,
            'feel_overrides' => null,
            'animation_overrides' => null,
            'header_overrides' => null,
            'footer_overrides' => null,
        ]);

        $this->invalidateConfigShop($config);

        return $config;
    }

    private function prepareSections(array $defaultSections): array
    {
        return array_map(function (array $section) {
            return [
                'id' => $this->generateSectionId(),
                'type' => $section['type'],
                'variant' => $section['variant'] ?? 'default',
                'is_visible' => true,
                'config' => $section['config'] ?? [],
            ];
        }, $defaultSections);
    }

    private function generateSectionId(): string
    {
        return 'sec_'.Str::random(12);
    }

    private function invalidatePageShop(StorefrontPage $page): void
    {
        $page->loadMissing('shop');
        $this->cache->invalidateShop($page->shop);
    }

    private function invalidateConfigShop(StorefrontConfig $config): void
    {
        $config->loadMissing('shop');
        $this->cache->invalidateShop($config->shop);
    }

    private function getPageSortOrder(StorefrontPageType $pageType): int
    {
        return match ($pageType) {
            StorefrontPageType::HOME => 1,
            StorefrontPageType::PRODUCTS => 2,
            StorefrontPageType::PRODUCT_DETAIL => 3,
            StorefrontPageType::ABOUT => 4,
            StorefrontPageType::CONTACT => 5,
            StorefrontPageType::CART => 6,
            StorefrontPageType::CHECKOUT => 7,
            StorefrontPageType::CUSTOM => 8,
        };
    }
}
