# Storefront Builder — Foundation + Classic Commerce Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete storefront builder infrastructure (Stage 0) and the first template — Classic Commerce with 6 themes (Stage 1) — producing a working, deployable storefront system where shop owners can pick a template/theme, customize within guardrails, compose pages from sections, and publish a unique-looking storefront.

**Architecture:** Three-layer hierarchy (Template → Theme → Customization) following Amoriie's proven pattern. Public storefront decoupled from Inertia — Blade bootstraps standalone React app with JSON page data. Builder UI lives within existing Inertia admin panel. Section components are shared scaffolds driven by theme config data objects. Animation tier system loads libraries conditionally per template.

**Tech Stack:** Laravel 12, PostgreSQL, React 19, TypeScript, Tailwind CSS, Inertia.js (builder only), GSAP (future), Framer Motion (already installed), dnd-kit (drag-and-drop), Tiptap (rich text), Lenis (future smooth scroll)

**Spec:** `docs/STOREFRONT_SYSTEM_OVERHAUL.md`

**Existing code to reuse:**
- `app/Services/StorefrontService.php` — data resolution methods become section data resolvers
- `app/Services/CartService.php` — untouched, used by storefront
- `app/Services/CheckoutService.php` — untouched
- `routes/storefront.php` — storefront home/products/product-detail routes point to new render controller; cart, checkout, customer auth, customer portal routes stay on existing controllers untouched
- `app/Models/Shop.php` — add storefrontConfig relationship
- `app/Traits/BelongsToTenant.php` — used by all new tenant-scoped models
- `app/Scopes/TenantScope.php` — auto-applied via trait
- `resources/js/components/storefront/` — 14 existing Inertia-based storefront components (ProductCard, CartDrawer, QuantitySelector, PriceDisplay, etc.). The new builder storefront creates its own components at `resources/js/storefront/components/` — these are theme-driven and CSS-variable-based, structurally different from the existing Inertia components. The old components remain in use for the transition period until the builder storefront fully replaces the Inertia storefront.
- `resources/js/pages/Storefront/` — 14 existing Inertia page components. These stay for cart, checkout, auth, and account pages during the transition.

**Key dependencies already installed:** `framer-motion`, `react-dnd`, `@radix-ui/*`, `lucide-react`, `zod`

**Dependencies to install during implementation:**
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag-and-drop for builder (Task 14)
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link` — rich text editor for builder config fields (Task 14)

**Spec divergences:**
- The spec defines all model PKs as `uuid`. The codebase uses auto-incrementing integer PKs exclusively. This plan uses integer PKs to match the codebase.
- The spec does not address services (haircuts, repairs). The current storefront supports services alongside products. Service support in the builder is deferred to a future stage.

**Route transition strategy:**
The existing `routes/storefront.php` has 30+ routes on 5 controllers (StorefrontController, CartController, CheckoutController, CustomerAuthController, CustomerPortalController). The builder replaces **only** the page-rendering routes (home, products, product detail) by swapping StorefrontController for StorefrontRenderController. All other routes (cart CRUD, checkout, customer auth, customer portal) stay on their existing controllers unchanged. Service routes (`/services`, `/services/{slug}`) remain on StorefrontController until services are added to the builder in a future stage.

---

## Chunk 0: Prerequisites

### Task 0: Populate Prerequisite Factories

**Files:**
- Modify: `database/factories/TenantFactory.php`
- Modify: `database/factories/ShopFactory.php`
- Modify: `database/factories/UserFactory.php` — add `tenant_id` and `role` defaults
- Create: `database/factories/ProductFactory.php`
- Create: `database/factories/ProductVariantFactory.php`

**Why:** Every feature test in this plan calls `Tenant::factory()->create()`, `Shop::factory()->create()`, `User::factory()->create()`, and `Product::factory()->create()`. Currently, `TenantFactory` and `ShopFactory` have **empty** `definition()` methods, `UserFactory` is missing `tenant_id`/`role` defaults, and `ProductFactory` does not exist. All tests will fail at factory creation without this.

- [ ] **Step 1: Populate TenantFactory**

```php
public function definition(): array
{
    return [
        'name' => fake()->company(),
        'slug' => fake()->unique()->slug(),
        'owner_email' => fake()->unique()->safeEmail(),
        'business_type' => fake()->randomElement(['retail', 'wholesale', 'services']),
        'phone' => fake()->phoneNumber(),
        'is_active' => true,
        'subscription_plan' => 'standard',
        'max_shops' => 5,
        'max_users' => 20,
        'max_products' => 500,
    ];
}
```

- [ ] **Step 2: Populate ShopFactory**

```php
public function definition(): array
{
    return [
        'tenant_id' => Tenant::factory(),
        'shop_type_id' => ShopType::factory(),
        'name' => fake()->company() . ' Store',
        'slug' => fake()->unique()->slug(),
        'is_active' => true,
        'storefront_enabled' => false,
        'currency' => 'NGN',
        'currency_symbol' => '₦',
        'currency_decimals' => 2,
        'vat_enabled' => false,
        'vat_rate' => 0,
        'vat_inclusive' => false,
    ];
}
```

Check if `ShopType::factory()` needs populating too. If ShopTypeFactory is empty, populate it with: `['tenant_id' => Tenant::factory(), 'label' => fake()->word(), 'slug' => fake()->unique()->slug(), 'is_active' => true]`.

- [ ] **Step 3: Add defaults to UserFactory**

Add `tenant_id` and `role` to UserFactory's `definition()`:

```php
'tenant_id' => Tenant::factory(),
'role' => UserRole::OWNER,
'is_active' => true,
```

- [ ] **Step 4: Create ProductFactory**

```bash
php artisan make:factory ProductFactory
```

```php
public function definition(): array
{
    return [
        'tenant_id' => Tenant::factory(),
        'shop_id' => Shop::factory(),
        'name' => fake()->words(3, true),
        'slug' => fake()->unique()->slug(),
        'description' => fake()->sentence(),
        'is_active' => true,
        'is_featured' => false,
        'has_variants' => false,
        'track_stock' => true,
        'is_taxable' => false,
        'display_order' => 0,
    ];
}

public function featured(): static
{
    return $this->state(['is_featured' => true]);
}
```

- [ ] **Step 5: Create ProductVariantFactory**

```bash
php artisan make:factory ProductVariantFactory
```

Populate with: `product_id`, `tenant_id`, `name`, `sku` (unique), `price`, `cost_price`, `stock_quantity`, `is_available_online`. Check the ProductVariant model's fillable for exact columns.

- [ ] **Step 6: Run existing tests to verify factories don't break anything**

Run: `php artisan test --compact`

If any existing tests relied on the empty factories (unlikely but possible), fix them.

- [ ] **Step 7: Commit**

```bash
git add database/factories/
git commit -m "chore: populate Tenant, Shop, User, Product, and ProductVariant factories for storefront tests"
```

---

## Chunk 1: Data Layer

### Task 1: Enums

**Files:**
- Create: `app/Enums/StorefrontTemplateCategory.php`
- Create: `app/Enums/StorefrontAnimationTier.php`
- Create: `app/Enums/StorefrontPageType.php`
- Create: `app/Enums/StorefrontThemeCategory.php`
- Create: `app/Enums/SectionCategory.php`
- Test: `tests/Unit/Enums/StorefrontEnumsTest.php`

**Reference:** Follow pattern in existing enums (e.g., `app/Enums/OrderStatus.php`). PHP 8.1+ backed string enums with UPPER_CASE cases, `label()` method, and `forSelect()` static method. No `HasSelectOptions` trait exists — use `forSelect()` per existing pattern.

- [ ] **Step 1: Write tests for all five enums**

```php
<?php

use App\Enums\StorefrontTemplateCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Enums\StorefrontThemeCategory;
use App\Enums\SectionCategory;

it('has all template categories', function () {
    expect(StorefrontTemplateCategory::cases())->toHaveCount(11);
    expect(StorefrontTemplateCategory::COMMERCE->value)->toBe('commerce');
    expect(StorefrontTemplateCategory::COMMERCE->label())->toBe('Commerce');
});

it('has all animation tiers', function () {
    expect(StorefrontAnimationTier::cases())->toHaveCount(4);
    expect(StorefrontAnimationTier::NONE->value)->toBe('none');
    expect(StorefrontAnimationTier::CINEMATIC->value)->toBe('cinematic');
});

it('has all page types', function () {
    expect(StorefrontPageType::cases())->toHaveCount(8);
    expect(StorefrontPageType::HOME->value)->toBe('home');
    expect(StorefrontPageType::PRODUCT_DETAIL->value)->toBe('product_detail');
});

it('has all theme categories', function () {
    expect(StorefrontThemeCategory::cases())->toHaveCount(6);
    expect(StorefrontThemeCategory::GENERAL->value)->toBe('general');
    expect(StorefrontThemeCategory::FASHION->label())->toBe('Fashion & Luxury');
});

it('has all section categories', function () {
    expect(SectionCategory::cases())->toHaveCount(8);
    expect(SectionCategory::HERO->value)->toBe('hero');
    expect(SectionCategory::PRODUCTS->value)->toBe('products');
});
```

- [ ] **Step 2: Run tests — expect FAIL (classes don't exist)**

Run: `php artisan test tests/Unit/Enums/StorefrontEnumsTest.php`

- [ ] **Step 3: Create all five enum files**

`StorefrontTemplateCategory`: COMMERCE, EDITORIAL, MARKETPLACE, IMMERSIVE, CATALOG, STORYTELLER, SERVICE, CONTENT, CAMPAIGN, SOCIAL, SPECIALTY

`StorefrontAnimationTier`: NONE, SUBTLE, POLISHED, CINEMATIC

`StorefrontPageType`: HOME, PRODUCTS, PRODUCT_DETAIL, CART, CHECKOUT, ABOUT, CONTACT, CUSTOM

`StorefrontThemeCategory`: GENERAL, FASHION, GROCERY, HEALTH, TECH, ARTISAN — categorizes themes by target market.

`SectionCategory`: HERO, PRODUCTS, CONTENT, SOCIAL_PROOF, NAVIGATION, COMMERCE, MEDIA, LAYOUT

Each with `label()` method using `match($this)` and `forSelect()` static method matching existing enum pattern:
```php
public static function forSelect(): array
{
    return collect(self::cases())
        ->mapWithKeys(fn ($case) => [$case->value => $case->label()])
        ->toArray();
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `php artisan test tests/Unit/Enums/StorefrontEnumsTest.php`

- [ ] **Step 5: Commit**

```bash
git add app/Enums/Storefront* app/Enums/SectionCategory.php tests/Unit/Enums/StorefrontEnumsTest.php
git commit -m "feat(storefront): add enums for template categories, animation tiers, page types, theme categories, and section categories"
```

---

### Task 2: Database Migrations

**Files:**
- Create: `database/migrations/xxxx_create_storefront_templates_table.php`
- Create: `database/migrations/xxxx_create_storefront_themes_table.php`
- Create: `database/migrations/xxxx_create_storefront_configs_table.php`
- Create: `database/migrations/xxxx_create_storefront_pages_table.php`
- Create: `database/migrations/xxxx_create_storefront_media_table.php`

**Reference:** Follow pattern in existing migrations. Auto-incrementing integer PKs via `$table->id()`. Foreign keys via `foreignId()` with `constrained()->cascadeOnDelete()` where appropriate. JSONB for flexible config columns.

- [ ] **Step 1: Create storefront_templates migration**

```bash
php artisan make:migration create_storefront_templates_table
```

```php
Schema::create('storefront_templates', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->string('category');
    $table->jsonb('structural_config');
    $table->string('animation_tier')->default('subtle');
    $table->jsonb('supported_sections');
    $table->jsonb('supported_pages');
    $table->string('navigation_pattern')->default('standard');
    $table->string('scroll_behavior')->default('standard');
    $table->boolean('is_premium')->default(false);
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

- [ ] **Step 2: Create storefront_themes migration**

```bash
php artisan make:migration create_storefront_themes_table
```

```php
Schema::create('storefront_themes', function (Blueprint $table) {
    $table->id();
    $table->foreignId('template_id')->constrained('storefront_templates')->cascadeOnDelete();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->string('thumbnail_path')->nullable();
    $table->string('ideal_for')->nullable();
    $table->jsonb('theme_config');
    $table->jsonb('default_sections');
    $table->boolean('is_premium')->default(false);
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

- [ ] **Step 3: Create storefront_configs migration**

```bash
php artisan make:migration create_storefront_configs_table
```

```php
Schema::create('storefront_configs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
    $table->foreignId('theme_id')->constrained('storefront_themes');
    $table->string('color_preset')->nullable();
    $table->jsonb('color_overrides')->nullable();
    $table->string('typography_preset')->nullable();
    $table->jsonb('typography_overrides')->nullable();
    $table->jsonb('component_overrides')->nullable();
    $table->jsonb('feel_overrides')->nullable();
    $table->jsonb('animation_overrides')->nullable();
    $table->jsonb('header_overrides')->nullable();
    $table->jsonb('footer_overrides')->nullable();
    $table->string('logo_path')->nullable();
    $table->string('favicon_path')->nullable();
    $table->jsonb('social_links')->nullable();
    $table->jsonb('global_announcement')->nullable();
    $table->text('custom_css')->nullable();
    $table->jsonb('seo_defaults')->nullable();
    $table->boolean('is_published')->default(false);
    $table->timestamp('published_at')->nullable();
    $table->timestamps();

    $table->unique('shop_id');
});
```

- [ ] **Step 4: Create storefront_pages migration**

```bash
php artisan make:migration create_storefront_pages_table
```

```php
Schema::create('storefront_pages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
    $table->foreignId('storefront_config_id')->constrained('storefront_configs')->cascadeOnDelete();
    $table->string('page_type');
    $table->string('slug')->nullable();
    $table->string('title');
    $table->jsonb('sections')->default('[]');
    $table->string('seo_title')->nullable();
    $table->text('seo_description')->nullable();
    $table->string('seo_image_path')->nullable();
    $table->boolean('is_published')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();

    $table->unique(['shop_id', 'page_type', 'slug']);
});
```

**Note:** The composite unique on `[shop_id, page_type, slug]` allows multiple `custom` pages per shop (each with a different slug) while still preventing duplicate standard pages (where slug is null).

- [ ] **Step 5: Create storefront_media migration**

```bash
php artisan make:migration create_storefront_media_table
```

```php
Schema::create('storefront_media', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
    $table->string('file_path');
    $table->string('file_name');
    $table->string('mime_type');
    $table->integer('file_size');
    $table->jsonb('dimensions')->nullable();
    $table->string('alt_text')->nullable();
    $table->string('usage_context')->nullable();
    $table->timestamps();
});
```

- [ ] **Step 6: Run migrations**

Run: `php artisan migrate`
Expected: All 5 tables created successfully.

- [ ] **Step 7: Commit**

```bash
git add database/migrations/*storefront*
git commit -m "feat(storefront): add migrations for templates, themes, configs, pages, and media"
```

---

### Task 3: Eloquent Models

**Files:**
- Create: `app/Models/StorefrontTemplate.php`
- Create: `app/Models/StorefrontTheme.php`
- Create: `app/Models/StorefrontConfig.php`
- Create: `app/Models/StorefrontPage.php`
- Create: `app/Models/StorefrontMedia.php`
- Modify: `app/Models/Shop.php` — add `storefrontConfig()` relationship
- Test: `tests/Feature/Models/StorefrontModelTest.php`

**Reference:** Follow existing model patterns. The project uses auto-incrementing integer PKs (`$table->id()`), NOT UUIDs — no HasUuid/HasUuids traits exist. Use `BelongsToTenant` on tenant-scoped models. Use `casts()` method for new models (matches User.php and CLAUDE.md convention).

- [ ] **Step 1: Write model relationship tests**

```php
<?php

use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\StorefrontMedia;
use App\Models\Shop;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('template has many themes', function () {
    $template = StorefrontTemplate::factory()->create();
    $themes = StorefrontTheme::factory()->count(3)->create(['template_id' => $template->id]);

    expect($template->themes)->toHaveCount(3);
    expect($template->themes->first())->toBeInstanceOf(StorefrontTheme::class);
});

it('theme belongs to template', function () {
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);

    expect($theme->template)->toBeInstanceOf(StorefrontTemplate::class);
    expect($theme->template->id)->toBe($template->id);
});

it('config belongs to shop and theme', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);

    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    expect($config->shop)->toBeInstanceOf(Shop::class);
    expect($config->theme)->toBeInstanceOf(StorefrontTheme::class);
    expect($shop->fresh()->storefrontConfig)->toBeInstanceOf(StorefrontConfig::class);
});

it('page belongs to config and has sections as array', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    $page = StorefrontPage::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'sections' => [
            ['id' => 'sec_1', 'type' => 'hero_banner', 'variant' => 'centered_overlay', 'is_visible' => true, 'config' => []],
        ],
    ]);

    expect($page->sections)->toBeArray();
    expect($page->sections[0]['type'])->toBe('hero_banner');
});

it('enforces one config per shop', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);

    StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]);

    expect(fn () => StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `php artisan test tests/Feature/Models/StorefrontModelTest.php`

- [ ] **Step 3: Create StorefrontTemplate model**

No `BelongsToTenant` — platform-level resource (no tenant_id). Uses standard auto-incrementing integer PK. Cast `structural_config`, `supported_sections`, `supported_pages` to `array`. Cast `category` to `StorefrontTemplateCategory` enum. Cast `animation_tier` to `StorefrontAnimationTier` enum.

Relationships: `themes()` → HasMany StorefrontTheme.

- [ ] **Step 4: Create StorefrontTheme model**

No `BelongsToTenant`. Cast `theme_config` and `default_sections` to `array`.

Relationships: `template()` → BelongsTo StorefrontTemplate. `shopConfigs()` → HasMany StorefrontConfig.

- [ ] **Step 5: Create StorefrontConfig model**

Uses `BelongsToTenant`. Cast all `*_overrides` columns to `array`. Cast `social_links`, `global_announcement`, `seo_defaults` to `array`. Cast `is_published` to `boolean`. Cast `published_at` to `datetime`.

Relationships: `tenant()`, `shop()`, `theme()`, `pages()` → HasMany StorefrontPage.

- [ ] **Step 6: Create StorefrontPage model**

Uses `BelongsToTenant`. Cast `sections` to `array`. Cast `page_type` to `StorefrontPageType` enum. Cast `is_published` to `boolean`.

Relationships: `tenant()`, `shop()`, `storefrontConfig()` → BelongsTo StorefrontConfig.

- [ ] **Step 7: Create StorefrontMedia model**

Uses `BelongsToTenant`. Cast `dimensions` to `array`.

Relationships: `tenant()`, `shop()`.

- [ ] **Step 8: Add storefrontConfig relationship to Shop model**

In `app/Models/Shop.php`, add:

```php
public function storefrontConfig(): HasOne
{
    return $this->hasOne(StorefrontConfig::class);
}
```

- [ ] **Step 9: Create factories for all 5 models**

Create: `database/factories/StorefrontTemplateFactory.php`, `StorefrontThemeFactory.php`, `StorefrontConfigFactory.php`, `StorefrontPageFactory.php`, `StorefrontMediaFactory.php`

Each factory should produce realistic default data. Theme factory should include a minimal but valid `theme_config` JSON. Template factory should include valid `structural_config`. Page factory should default `page_type` to `StorefrontPageType::HOME` and `sections` to an empty array.

- [ ] **Step 10: Run tests — expect PASS**

Run: `php artisan test tests/Feature/Models/StorefrontModelTest.php`

- [ ] **Step 11: Commit**

```bash
git add app/Models/Storefront* app/Models/Shop.php database/factories/Storefront* tests/Feature/Models/StorefrontModelTest.php
git commit -m "feat(storefront): add Eloquent models, factories, and relationships for builder data layer"
```

---

## Chunk 2: Section Type System

### Task 4: Section Interface & Registry

**Files:**
- Create: `app/Contracts/StorefrontSectionInterface.php`
- Create: `app/Services/Storefront/SectionTypeRegistry.php`
- Create: `app/Providers/StorefrontServiceProvider.php`
- Test: `tests/Unit/Services/Storefront/SectionTypeRegistryTest.php`

**Reference:** Spec defines the interface at `docs/STOREFRONT_SYSTEM_OVERHAUL.md` § Section Type Interface. The registry is a simple service that holds registered section types and provides lookup/filtering methods.

- [ ] **Step 1: Write registry tests**

```php
<?php

use App\Services\Storefront\SectionTypeRegistry;
use App\Contracts\StorefrontSectionInterface;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;

it('registers and retrieves section types', function () {
    $registry = new SectionTypeRegistry();
    $section = mock(StorefrontSectionInterface::class);
    $section->shouldReceive('type')->andReturn('hero_banner');
    $section->shouldReceive('category')->andReturn(SectionCategory::HERO);
    $section->shouldReceive('allowedPageTypes')->andReturn([]);
    $section->shouldReceive('minimumAnimationTier')->andReturn(StorefrontAnimationTier::Subtle);

    $registry->register($section);

    expect($registry->get('hero_banner'))->toBe($section);
    expect($registry->get('nonexistent'))->toBeNull();
    expect($registry->all())->toHaveCount(1);
});

it('filters sections by category', function () {
    $registry = new SectionTypeRegistry();

    $hero = mock(StorefrontSectionInterface::class);
    $hero->shouldReceive('type')->andReturn('hero_banner');
    $hero->shouldReceive('category')->andReturn(SectionCategory::HERO);

    $products = mock(StorefrontSectionInterface::class);
    $products->shouldReceive('type')->andReturn('featured_products');
    $products->shouldReceive('category')->andReturn(SectionCategory::PRODUCTS);

    $registry->register($hero);
    $registry->register($products);

    $byCategory = $registry->byCategory();
    expect($byCategory)->toHaveKey('hero');
    expect($byCategory['hero'])->toHaveCount(1);
    expect($byCategory['products'])->toHaveCount(1);
});

it('filters sections by page type', function () {
    $registry = new SectionTypeRegistry();

    $hero = mock(StorefrontSectionInterface::class);
    $hero->shouldReceive('type')->andReturn('hero_banner');
    $hero->shouldReceive('allowedPageTypes')->andReturn([StorefrontPageType::HOME, StorefrontPageType::ABOUT]);

    $grid = mock(StorefrontSectionInterface::class);
    $grid->shouldReceive('type')->andReturn('product_grid');
    $grid->shouldReceive('allowedPageTypes')->andReturn([StorefrontPageType::PRODUCTS]);

    $registry->register($hero);
    $registry->register($grid);

    $forHome = $registry->forPageType(StorefrontPageType::HOME);
    expect($forHome)->toHaveCount(1);
    expect($forHome[0]->type())->toBe('hero_banner');
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Create StorefrontSectionInterface**

```php
<?php

namespace App\Contracts;

use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Enums\StorefrontPageType;
use App\Models\Shop;

interface StorefrontSectionInterface
{
    public function type(): string;
    public function label(): string;
    public function description(): string;
    public function category(): SectionCategory;
    public function icon(): string;
    public function variants(): array;
    public function configSchema(): array;
    public function defaultConfig(): array;
    public function resolveData(array $config, Shop $shop): array;
    public function allowedPageTypes(): array;
    public function maxPerPage(): int;
    public function minimumAnimationTier(): StorefrontAnimationTier;
}
```

- [ ] **Step 4: Create SectionTypeRegistry**

Methods: `register()`, `get()`, `all()`, `byCategory()`, `forPageType()`, `forTemplate()`, `resolveData()`, `getBuilderManifest()`.

`forTemplate(StorefrontTemplate $template): array` — filters registered sections to only those in the template's `supported_sections` list. Used by the render pipeline.

`getBuilderManifest(StorefrontTemplate $template): array` — returns only section types the template supports, with config schema and variant list for each. Used by the builder UI.

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Create StorefrontServiceProvider**

Register `SectionTypeRegistry` as singleton in the container. In `boot()`, register all section type classes (start with stubs — real implementations come in Task 5). Register the provider in `config/app.php` (or auto-discovery).

- [ ] **Step 7: Commit**

```bash
git add app/Contracts/ app/Services/Storefront/SectionTypeRegistry.php app/Providers/StorefrontServiceProvider.php tests/Unit/Services/Storefront/
git commit -m "feat(storefront): add section interface, type registry, and service provider"
```

---

### Task 5: Core Section Type Classes (PHP)

**Files:**
- Create: `app/Services/Storefront/Sections/HeroBannerSection.php`
- Create: `app/Services/Storefront/Sections/FeaturedProductsSection.php`
- Create: `app/Services/Storefront/Sections/ProductGridSection.php`
- Create: `app/Services/Storefront/Sections/CategoryGridSection.php`
- Create: `app/Services/Storefront/Sections/RichTextSection.php`
- Create: `app/Services/Storefront/Sections/ImageWithTextSection.php`
- Create: `app/Services/Storefront/Sections/TestimonialsSection.php`
- Create: `app/Services/Storefront/Sections/AnnouncementBarSection.php`
- Create: `app/Services/Storefront/Sections/NewsletterSignupSection.php`
- Create: `app/Services/Storefront/Sections/BannerSection.php`
- Create: `app/Services/Storefront/Sections/SpacerSection.php`
- Create: `app/Services/Storefront/Sections/GallerySection.php`
- Create: `app/Services/Storefront/Sections/VideoSection.php`
- Create: `app/Services/Storefront/Sections/FaqSection.php`
- Create: `app/Services/Storefront/Sections/ContactFormSection.php`
- Create: `app/Services/Storefront/Sections/LogoCloudSection.php`
- Create: `app/Services/Storefront/Sections/CountdownSection.php`
- Create: `app/Services/Storefront/Sections/CollectionListSection.php`
- Create: `app/Services/Storefront/Sections/RecentlyViewedSection.php`
- Create: `app/Services/Storefront/Sections/MapSection.php`
- Test: `tests/Unit/Services/Storefront/Sections/SectionTypesTest.php`

**Reference:** Each section type definition is in `docs/STOREFRONT_SYSTEM_OVERHAUL.md` § Section Types — Complete Definitions. Every section implements `StorefrontSectionInterface`.

**Pattern for data-resolving sections:** `FeaturedProductsSection`, `ProductGridSection`, `CategoryGridSection`, `CollectionListSection`, `ContactFormSection`, `MapSection` all query the database. Reuse logic from existing `StorefrontService` methods. Others return empty arrays from `resolveData()`.

- [ ] **Step 1: Write tests for section type classes**

Test each section implements the interface, returns correct type/label/category, returns valid config schema, and variants match spec. For data-resolving sections, test `resolveData()` returns expected data shape.

```php
<?php

use App\Services\Storefront\Sections\HeroBannerSection;
use App\Services\Storefront\Sections\FeaturedProductsSection;
use App\Enums\SectionCategory;
use App\Enums\StorefrontAnimationTier;
use App\Contracts\StorefrontSectionInterface;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('hero banner implements interface correctly', function () {
    $section = new HeroBannerSection();

    expect($section)->toBeInstanceOf(StorefrontSectionInterface::class);
    expect($section->type())->toBe('hero_banner');
    expect($section->category())->toBe(SectionCategory::HERO);
    expect($section->maxPerPage())->toBe(1);
    expect($section->variants())->toContain('centered_overlay', 'split_image', 'slideshow', 'minimal_text');
    expect($section->configSchema())->toBeArray()->not->toBeEmpty();
    expect($section->defaultConfig())->toHaveKey('heading');
});

it('featured products resolves data from database', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    Product::factory()->count(3)->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'is_active' => true,
        'is_featured' => true,
    ]);

    $section = new FeaturedProductsSection();
    $data = $section->resolveData(['product_source' => 'featured', 'max_items' => 8], $shop);

    expect($data)->toHaveCount(3);
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement all 20 section type classes**

Each class follows the same pattern. Reference the spec for exact config schema fields, variants, allowed page types, and data resolver logic per section type.

For data-resolving sections, reuse query patterns from `app/Services/StorefrontService.php`:
- `FeaturedProductsSection::resolveData()` — reuse `getFeaturedProducts()` logic
- `ProductGridSection::resolveData()` — reuse `getProducts()` logic
- `CategoryGridSection::resolveData()` — reuse `getCategories()` logic
- `ContactFormSection::resolveData()` — return shop contact details
- `MapSection::resolveData()` — return shop address
- `CollectionListSection::resolveData()` — product queries per collection config

- [ ] **Step 4: Register all sections in StorefrontServiceProvider::boot()**

- [ ] **Step 5: Run tests — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add app/Services/Storefront/Sections/ app/Providers/StorefrontServiceProvider.php tests/Unit/Services/Storefront/Sections/
git commit -m "feat(storefront): implement all 20 section type classes with config schemas and data resolvers"
```

---

## Chunk 3: Rendering Pipeline

### Task 6: StorefrontRenderService

**Files:**
- Create: `app/Services/Storefront/StorefrontRenderService.php`
- Test: `tests/Feature/Services/Storefront/StorefrontRenderServiceTest.php`

**Reference:** Spec § Storefront Rendering Pipeline → StorefrontRenderService. Key methods: `buildPage()`, `resolveSections()`, `resolveThemeConfig()`, `buildThemeStyles()`, `buildSeoMeta()`.

The critical method is `resolveThemeConfig()` — it merges theme defaults with shop overrides. The spec shows the merge logic.

- [ ] **Step 1: Write tests**

Test `resolveThemeConfig()` merges defaults and overrides. Test `buildThemeStyles()` generates valid CSS variable string. Test `buildPage()` returns complete page payload.

```php
<?php

use App\Services\Storefront\StorefrontRenderService;
use App\Services\Storefront\SectionTypeRegistry;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Models\Shop;
use App\Models\Tenant;
use App\Enums\StorefrontPageType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('resolves theme config by merging defaults with overrides', function () {
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create([
        'template_id' => $template->id,
        'theme_config' => [
            'palette' => [
                'presets' => [
                    ['name' => 'Default', 'primary' => '#e94560', 'background' => '#ffffff'],
                    ['name' => 'Ocean', 'primary' => '#0ea5e9', 'background' => '#ffffff'],
                ],
                'allow_custom' => false,
            ],
            'typography' => [
                'options' => [
                    ['name' => 'Default', 'heading_font' => 'DM Sans', 'body_font' => 'DM Sans', 'heading_weight' => '700', 'body_weight' => '400'],
                ],
                'base_size' => 16,
                'line_height' => 1.6,
            ],
            'components' => ['button_style' => 'rounded'],
            'feel' => ['shadow_depth' => 'subtle', 'border_radius' => '8px', 'section_spacing' => '64px'],
            'animation' => ['entrance_style' => 'fade_up', 'hover_style' => 'elevate'],
            'header' => ['variant' => 'standard', 'position' => 'sticky'],
            'footer' => ['variant' => 'multi_column'],
            'hero' => ['default_variant' => 'centered_overlay'],
            'product_card' => ['variant' => 'default'],
            'decorations' => ['background_pattern' => 'none'],
        ],
    ]);
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id]);
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
        'color_preset' => 'Ocean',
        'component_overrides' => ['button_style' => 'pill'],
    ]);

    $service = app(StorefrontRenderService::class);
    $resolved = $service->resolveThemeConfig($config);

    expect($resolved['colors']['primary'])->toBe('#0ea5e9');
    expect($resolved['components']['button_style'])->toBe('pill');
    expect($resolved['feel']['shadow_depth'])->toBe('subtle');
});

it('builds CSS variable string from resolved theme', function () {
    $service = app(StorefrontRenderService::class);
    $resolved = [
        'colors' => ['primary' => '#e94560', 'background' => '#ffffff', 'text' => '#1a1a2e'],
        'typography' => ['heading_font' => 'DM Sans', 'body_font' => 'DM Sans', 'base_size' => 16, 'line_height' => 1.6],
        'feel' => ['border_radius' => '8px', 'section_spacing' => '64px'],
    ];

    $css = $service->buildThemeStyles($resolved);

    expect($css)->toContain('--color-primary: #e94560');
    expect($css)->toContain('--font-heading: "DM Sans"');
    expect($css)->toContain('--radius: 8px');
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement StorefrontRenderService**

Inject `SectionTypeRegistry` via constructor. Implement all methods per spec. `resolveThemeConfig()` uses the merge logic from spec. `buildPage()` assembles the complete page payload: shop data, resolved theme, CSS variables, resolved sections with data, SEO meta, cart summary, navigation.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add app/Services/Storefront/StorefrontRenderService.php tests/Feature/Services/Storefront/
git commit -m "feat(storefront): implement render service with theme resolution and CSS variable generation"
```

---

### Task 7: Render Controller, Routes & Blade View

**Files:**
- Create: `app/Http/Controllers/StorefrontRenderController.php`
- Modify: `routes/storefront.php` — add new render routes alongside existing
- Create: `resources/views/storefront/builder-app.blade.php`
- Modify: `vite.config.ts` — add second entry point
- Test: `tests/Feature/Http/Controllers/StorefrontRenderControllerTest.php`

**Reference:** Spec § Route Structure and Blade View. The new render controller replaces `StorefrontController` for public routes, but we keep the old controller temporarily and add the new routes in parallel until the builder is fully working.

**IMPORTANT:** The new Blade view is a SEPARATE entry from the existing Inertia storefront. Name it `builder-app.blade.php` to avoid conflicts during transition. The final migration from old→new is Task 14.

- [ ] **Step 1: Write controller tests**

```php
<?php

use App\Models\Tenant;
use App\Models\Shop;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Enums\StorefrontPageType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('renders home page with complete page payload', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
        'is_published' => true,
    ]);
    StorefrontPage::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'title' => 'Home',
        'sections' => [],
    ]);

    $response = $this->get("/store/{$shop->slug}");

    $response->assertOk();
    $response->assertViewIs('storefront.builder-app');
    $response->assertViewHas('pageData');
});

it('returns 404 for unpublished storefront', function () {
    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create([
        'tenant_id' => $tenant->id,
        'storefront_enabled' => true,
    ]);
    $template = StorefrontTemplate::factory()->create();
    $theme = StorefrontTheme::factory()->create(['template_id' => $template->id]);
    StorefrontConfig::factory()->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'theme_id' => $theme->id,
        'is_published' => false,
    ]);

    $response = $this->get("/store/{$shop->slug}");

    $response->assertNotFound();
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Create StorefrontRenderController**

Methods: `home()`, `products()`, `productDetail()`, `page()`. Each resolves the shop, loads config/theme, calls `StorefrontRenderService::buildPage()`, returns Blade view with page data. Cart and checkout are NOT in this controller — they stay on the existing CartController and CheckoutController (Inertia-based).

Add `is_published` check — abort 404 if config not published (unless previewing from builder with admin auth).

```php
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Enums\StorefrontPageType;
use App\Services\Storefront\StorefrontRenderService;

class StorefrontRenderController extends Controller
{
    public function __construct(
        private readonly StorefrontRenderService $renderService
    ) {}

    public function home(Shop $shop)
    {
        return $this->renderPage($shop, StorefrontPageType::HOME);
    }

    public function products(Shop $shop)
    {
        return $this->renderPage($shop, StorefrontPageType::PRODUCTS);
    }

    public function productDetail(Shop $shop, string $slug)
    {
        return $this->renderPage($shop, StorefrontPageType::PRODUCT_DETAIL, $slug);
    }

    private function renderPage(Shop $shop, StorefrontPageType $pageType, ?string $slug = null)
    {
        $config = $shop->storefrontConfig;
        abort_unless($config?->is_published, 404);

        $pageData = $this->renderService->buildPage($shop, $pageType, $slug);

        return view('storefront.builder-app', [
            'pageData' => $pageData,
            'seo' => $pageData['seo'],
            'themeStyles' => $pageData['themeStyles'],
        ]);
    }
}
```

- [ ] **Step 4: Create Blade view**

`resources/views/storefront/builder-app.blade.php` — per spec. Injects CSS variables, loads storefront Vite entry, renders `<div id="storefront-root">` with JSON page data.

- [ ] **Step 5: Add second Vite entry point**

In `vite.config.ts`, add `'resources/js/storefront/app.tsx'` to the `input` array.

- [ ] **Step 6: Add routes**

In `routes/storefront.php`, swap **only** the page-rendering routes from `StorefrontController` to `StorefrontRenderController`. The new render controller handles the home page, products listing, and product detail. Everything else stays as-is.

**IMPORTANT:** Keep all routes inside the existing `Route::prefix('store/{shop:slug}')->middleware('storefront.enabled')` group.

**Specific changes to `routes/storefront.php`:**
```php
use App\Http\Controllers\StorefrontRenderController;

// REPLACE these 3 routes (lines 21-25):
//   Route::get('/', [StorefrontController::class, 'index'])->name('index');
//   Route::get('/products', [StorefrontController::class, 'products'])->name('products');
//   Route::get('/products/{product:slug}', [StorefrontController::class, 'show'])->name('product');
// WITH:
Route::get('/', [StorefrontRenderController::class, 'home'])->name('index');
Route::get('/products', [StorefrontRenderController::class, 'products'])->name('products');
Route::get('/products/{product:slug}', [StorefrontRenderController::class, 'productDetail'])->name('product');

// KEEP all other routes unchanged:
// - /services, /services/{service:slug} → StorefrontController (until services added to builder)
// - /cart, /cart/* → CartController
// - /login, /register, /forgot-password → CustomerAuthController
// - /checkout, /checkout/* → CheckoutController
// - /account/* → CustomerPortalController
```

**Fallback:** If a shop has a published `StorefrontConfig`, the new render controller serves theme-driven pages. If not, the render controller returns 404 (the old Inertia storefront is removed for these routes — shops must set up the builder to have a storefront). If a gradual rollout is needed, add a check: if `StorefrontConfig` exists, use builder; else, fall through to old controller. But the simpler approach is to require builder setup.

- [ ] **Step 7: Run tests — expect PASS**

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/StorefrontRenderController.php resources/views/storefront/builder-app.blade.php vite.config.ts routes/storefront.php tests/Feature/Http/Controllers/StorefrontRenderControllerTest.php
git commit -m "feat(storefront): add render controller, Blade view, and second Vite entry for decoupled storefront"
```

---

## Chunk 4: Storefront React Foundation

### Task 8: TypeScript Types & React Entry Point

**Files:**
- Create: `resources/js/storefront/types/storefront.ts`
- Create: `resources/js/storefront/app.tsx`
- Create: `resources/js/storefront/StorefrontRenderer.tsx`

**Reference:** Spec § React Storefront Architecture. Types must cover the full page payload, theme config, section definitions, and all component props.

- [ ] **Step 1: Create storefront TypeScript types**

```typescript
// resources/js/storefront/types/storefront.ts

export interface StorefrontPageData {
    shop: ShopData;
    theme: ResolvedTheme;
    themeStyles: string;
    page: PageData;
    seo: SeoData;
    cart: CartSummary;
    navigation: NavigationItem[];
}

export interface ShopData {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    currency_symbol: string;
    currency_decimals: number;
}

export interface ResolvedTheme {
    template: {
        slug: string;
        animation_tier: 'none' | 'subtle' | 'polished' | 'cinematic';
        structural_config: StructuralConfig;
    };
    colors: Record<string, string>;
    typography: TypographyConfig;
    components: ComponentConfig;
    feel: FeelConfig;
    animation: AnimationConfig;
    header: HeaderConfig;
    footer: FooterConfig;
    hero: HeroConfig;
    product_card: ProductCardConfig;
    decorations: DecorationConfig;
}

export interface PageData {
    type: string;
    title: string;
    sections: SectionData[];
}

export interface SectionData {
    id: string;
    type: string;
    variant: string;
    is_visible: boolean;
    scroll_animation: string;
    config: Record<string, unknown>;
    data: Record<string, unknown> | unknown[];
}

// ... (define all sub-interfaces: TypographyConfig, ComponentConfig, FeelConfig, etc.)
// ... (define CartSummary, NavigationItem, SeoData, ProductData, CategoryData)
```

Define ALL interfaces referenced in the storefront. No `any` types.

- [ ] **Step 2: Create React entry point**

```tsx
// resources/js/storefront/app.tsx
import { createRoot } from 'react-dom/client';
import { StorefrontRenderer } from './StorefrontRenderer';
import type { StorefrontPageData } from './types/storefront';

const rootEl = document.getElementById('storefront-root');
if (rootEl) {
    const pageData: StorefrontPageData = JSON.parse(rootEl.dataset.page || '{}');
    createRoot(rootEl).render(<StorefrontRenderer {...pageData} />);
}
```

- [ ] **Step 3: Create StorefrontRenderer**

```tsx
// resources/js/storefront/StorefrontRenderer.tsx
import { ThemeProvider } from './ThemeProvider';
import { AnimationProvider } from './AnimationProvider';
import { templateLayoutRegistry } from './layouts/registry';
import { sectionRegistry } from './sections/registry';
import type { StorefrontPageData, SectionData } from './types/storefront';

export function StorefrontRenderer({ shop, theme, page, cart, navigation }: StorefrontPageData) {
    const Layout = templateLayoutRegistry[theme.template.slug];

    if (!Layout) {
        return <div>Template not found: {theme.template.slug}</div>;
    }

    return (
        <ThemeProvider theme={theme}>
            <AnimationProvider theme={theme}>
                <Layout shop={shop} navigation={navigation} cart={cart} theme={theme}>
                    {page.sections
                        .filter((s: SectionData) => s.is_visible)
                        .map((section: SectionData) => {
                            const Component = sectionRegistry[section.type];
                            if (!Component) return null;
                            return (
                                <Component
                                    key={section.id}
                                    config={section.config}
                                    variant={section.variant}
                                    data={section.data}
                                    theme={theme}
                                />
                            );
                        })
                    }
                </Layout>
            </AnimationProvider>
        </ThemeProvider>
    );
}
```

- [ ] **Step 4: Create stub registries**

```tsx
// resources/js/storefront/layouts/registry.ts
import type { LayoutProps } from '../types/storefront';

export const templateLayoutRegistry: Record<string, React.FC<LayoutProps>> = {};

// resources/js/storefront/sections/registry.ts
import type { SectionProps } from '../types/storefront';

export const sectionRegistry: Record<string, React.FC<SectionProps>> = {};
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors (or only pre-existing ones).

- [ ] **Step 6: Commit**

```bash
git add resources/js/storefront/
git commit -m "feat(storefront): add React entry point, StorefrontRenderer, and TypeScript types"
```

---

### Task 9: ThemeProvider & AnimationProvider

**Files:**
- Create: `resources/js/storefront/ThemeProvider.tsx`
- Create: `resources/js/storefront/AnimationProvider.tsx`
- Create: `resources/js/storefront/hooks/useTheme.ts`
- Create: `resources/js/storefront/hooks/useAnimation.ts`

**Reference:** Spec § ThemeProvider and AnimationProvider. ThemeProvider injects CSS variables and provides theme context to all child components. AnimationProvider manages the animation tier and provides animation context to sections.

- [ ] **Step 1: Create ThemeProvider with CSS variable injection and React context**

```tsx
// resources/js/storefront/ThemeProvider.tsx
import { createContext, useContext, useMemo } from 'react';
import type { ResolvedTheme } from './types/storefront';

const ThemeContext = createContext<ResolvedTheme | null>(null);

interface ThemeProviderProps {
    theme: ResolvedTheme;
    children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
    const style = useMemo(() => ({
        '--color-primary': theme.colors.primary,
        '--color-secondary': theme.colors.secondary,
        '--color-accent': theme.colors.accent,
        '--color-background': theme.colors.background,
        '--color-surface': theme.colors.surface,
        '--color-text': theme.colors.text,
        '--color-text-muted': theme.colors.text_muted,
        '--color-border': theme.colors.border,
        '--color-header-bg': theme.colors.header_bg,
        '--color-header-text': theme.colors.header_text,
        '--color-footer-bg': theme.colors.footer_bg,
        '--color-footer-text': theme.colors.footer_text,
        '--color-button-bg': theme.colors.button_bg,
        '--color-button-text': theme.colors.button_text,
        '--color-button-hover-bg': theme.colors.button_hover_bg,
        '--color-badge-bg': theme.colors.badge_bg,
        '--color-badge-text': theme.colors.badge_text,
        '--color-sale': theme.colors.sale_color,
        '--color-success': theme.colors.success,
        '--color-error': theme.colors.error,
        '--font-heading': `"${theme.typography.heading_font}", sans-serif`,
        '--font-body': `"${theme.typography.body_font}", sans-serif`,
        '--font-size-base': `${theme.typography.base_size}px`,
        '--line-height': String(theme.typography.line_height),
        '--radius': theme.feel.border_radius,
        '--container-width': theme.template.structural_config.container_max_width || '1280px',
        '--section-spacing': theme.feel.section_spacing,
    } as React.CSSProperties), [theme]);

    return (
        <ThemeContext.Provider value={theme}>
            <div style={style} className="storefront-root">
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

// resources/js/storefront/hooks/useTheme.ts
export function useTheme(): ResolvedTheme {
    const theme = useContext(ThemeContext);
    if (!theme) throw new Error('useTheme must be used within ThemeProvider');
    return theme;
}
```

- [ ] **Step 2: Create AnimationProvider**

```tsx
// resources/js/storefront/AnimationProvider.tsx
import { createContext, useContext, useMemo } from 'react';
import type { ResolvedTheme } from './types/storefront';

type AnimationTier = 'none' | 'subtle' | 'polished' | 'cinematic';

interface AnimationContextValue {
    tier: AnimationTier;
    entranceStyle: string;
    hoverStyle: string;
    isReduced: boolean;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

interface AnimationProviderProps {
    theme: ResolvedTheme;
    children: React.ReactNode;
}

export function AnimationProvider({ theme, children }: AnimationProviderProps) {
    const value = useMemo(() => {
        const prefersReduced = typeof window !== 'undefined'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        return {
            tier: prefersReduced ? 'none' as AnimationTier : theme.template.animation_tier,
            entranceStyle: theme.animation.entrance_style,
            hoverStyle: theme.animation.hover_style,
            isReduced: prefersReduced,
        };
    }, [theme]);

    return (
        <AnimationContext.Provider value={value}>
            {children}
        </AnimationContext.Provider>
    );
}

// resources/js/storefront/hooks/useAnimation.ts
export function useAnimation(): AnimationContextValue {
    const ctx = useContext(AnimationContext);
    if (!ctx) throw new Error('useAnimation must be used within AnimationProvider');
    return ctx;
}
```

- [ ] **Step 3: Run TypeScript check**

- [ ] **Step 4: Commit**

```bash
git add resources/js/storefront/ThemeProvider.tsx resources/js/storefront/AnimationProvider.tsx resources/js/storefront/hooks/
git commit -m "feat(storefront): add ThemeProvider and AnimationProvider with CSS variable injection and animation context"
```

---

### Task 10: Classic Commerce Layout & Components

**Files:**
- Create: `resources/js/storefront/layouts/ClassicCommerceLayout.tsx`
- Create: `resources/js/storefront/layouts/components/headers/StandardHeader.tsx`
- Create: `resources/js/storefront/layouts/components/headers/CenteredLogoHeader.tsx`
- Create: `resources/js/storefront/layouts/components/footers/MultiColumnFooter.tsx`
- Create: `resources/js/storefront/layouts/components/footers/MinimalFooter.tsx`
- Create: `resources/js/storefront/layouts/components/footers/CenteredFooter.tsx`
- Create: `resources/js/storefront/components/ProductCard.tsx`
- Create: `resources/js/storefront/components/CartDrawer.tsx`
- Create: `resources/js/storefront/components/SearchBar.tsx`
- Create: `resources/js/storefront/components/ScrollAnimation.tsx`
- Modify: `resources/js/storefront/layouts/registry.ts` — register ClassicCommerceLayout

**Reference:** Use `/frontend-design` skill for ALL React components. Every component must be responsive, use CSS variables from ThemeProvider, and support the theme's component style options.

**IMPORTANT:** This task produces the visual components customers see. Quality matters. Use `/frontend-design` skill.

- [ ] **Step 1: Create ScrollAnimation wrapper**

IntersectionObserver-based. Applies entrance animation (fade_up, fade_in) when element enters viewport. Respects `prefers-reduced-motion`. For the Subtle tier only (Classic Commerce).

- [ ] **Step 2: Create StandardHeader**

Logo, navigation links, search icon, cart icon with count. Sticky option via `theme.header.position`. Uses CSS variables for colors. Responsive: hamburger menu on mobile.

- [ ] **Step 3: Create CenteredLogoHeader**

Logo centered, nav split on either side. Same responsive behavior.

- [ ] **Step 4: Create MultiColumnFooter, MinimalFooter, CenteredFooter**

Each structurally different. MultiColumn: 3-4 columns (links, contact, newsletter, social). Minimal: one-line copyright + social links. Centered: logo + links stacked centered.

- [ ] **Step 5: Create ClassicCommerceLayout**

Selects header variant from `theme.header.variant`. Selects footer variant from `theme.footer.variant`. Renders children (sections) between header and footer. Includes announcement bar if configured.

```tsx
export function ClassicCommerceLayout({ shop, navigation, cart, theme, children }: LayoutProps) {
    const Header = theme.header.variant === 'centered_logo' ? CenteredLogoHeader : StandardHeader;
    const Footer = footerRegistry[theme.footer.variant] || MultiColumnFooter;

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
            <Header shop={shop} navigation={navigation} cart={cart} theme={theme} />
            <main>{children}</main>
            <Footer shop={shop} theme={theme} />
        </div>
    );
}
```

- [ ] **Step 6: Create ProductCard component**

Renders a product card. Supports theme's `product_card.variant` (default, minimal, overlay, detailed). Uses CSS variables. Shows image, name, price (formatted with shop currency), sale badge, quick-add button. Responsive.

- [ ] **Step 7: Create CartDrawer and SearchBar**

CartDrawer: slide-out panel with cart items. SearchBar: expandable search input.

- [ ] **Step 8: Register ClassicCommerceLayout in registry**

- [ ] **Step 9: Run TypeScript check**

- [ ] **Step 10: Commit**

```bash
git add resources/js/storefront/layouts/ resources/js/storefront/components/
git commit -m "feat(storefront): add Classic Commerce layout with header/footer variants and shared components"
```

---

### Task 11: Section React Components

**Files:**
- Create: `resources/js/storefront/sections/HeroBannerSection/index.tsx`
- Create: `resources/js/storefront/sections/HeroBannerSection/CenteredOverlay.tsx`
- Create: `resources/js/storefront/sections/HeroBannerSection/SplitImage.tsx`
- Create: `resources/js/storefront/sections/HeroBannerSection/Slideshow.tsx`
- Create: `resources/js/storefront/sections/HeroBannerSection/MinimalText.tsx`
- Create: `resources/js/storefront/sections/FeaturedProductsSection/index.tsx`
- Create: `resources/js/storefront/sections/FeaturedProductsSection/StandardGrid.tsx`
- Create: `resources/js/storefront/sections/FeaturedProductsSection/SpotlightPlusGrid.tsx`
- Create: `resources/js/storefront/sections/FeaturedProductsSection/HorizontalScroll.tsx`
- Create: `resources/js/storefront/sections/ProductGridSection/index.tsx`
- Create: `resources/js/storefront/sections/CategoryGridSection/index.tsx`
- Create: `resources/js/storefront/sections/RichTextSection.tsx`
- Create: `resources/js/storefront/sections/ImageWithTextSection/index.tsx`
- Create: `resources/js/storefront/sections/TestimonialsSection/index.tsx`
- Create: `resources/js/storefront/sections/AnnouncementBarSection.tsx`
- Create: `resources/js/storefront/sections/NewsletterSignupSection/index.tsx`
- Create: `resources/js/storefront/sections/BannerSection.tsx`
- Create: `resources/js/storefront/sections/SpacerSection.tsx`
- Create: `resources/js/storefront/sections/GallerySection/index.tsx`
- Create: `resources/js/storefront/sections/VideoSection/index.tsx`
- Create: `resources/js/storefront/sections/FaqSection.tsx`
- Create: `resources/js/storefront/sections/ContactFormSection/index.tsx`
- Create: `resources/js/storefront/sections/LogoCloudSection.tsx`
- Create: `resources/js/storefront/sections/CountdownSection.tsx`
- Create: `resources/js/storefront/sections/CollectionListSection/index.tsx`
- Create: `resources/js/storefront/sections/RecentlyViewedSection.tsx`
- Create: `resources/js/storefront/sections/MapSection.tsx`
- Modify: `resources/js/storefront/sections/registry.ts` — register all sections

**Reference:** Use `/frontend-design` skill for EVERY section component. Each section with multiple variants uses an `index.tsx` that switches on the `variant` prop.

**Pattern:**

```tsx
// resources/js/storefront/sections/HeroBannerSection/index.tsx
import type { SectionProps } from '../../types/storefront';
import { CenteredOverlay } from './CenteredOverlay';
import { SplitImage } from './SplitImage';
import { Slideshow } from './Slideshow';
import { MinimalText } from './MinimalText';

const variants: Record<string, React.FC<SectionProps>> = {
    centered_overlay: CenteredOverlay,
    split_image: SplitImage,
    slideshow: Slideshow,
    minimal_text: MinimalText,
};

export function HeroBannerSection(props: SectionProps) {
    const Variant = variants[props.variant] || CenteredOverlay;
    return <Variant {...props} />;
}
```

**IMPORTANT:** This is the largest task. It should be split across multiple subagents if using subagent-driven development:
- **Subagent A:** Hero, Featured Products, Product Grid, Category Grid (product-facing sections)
- **Subagent B:** Rich Text, Image With Text, Testimonials, FAQ, Contact Form (content sections)
- **Subagent C:** Announcement Bar, Newsletter, Banner, Spacer, Gallery, Video, Logo Cloud, Countdown, Collection List, Recently Viewed, Map (remaining sections)

Each subagent should use `/frontend-design` skill and register their sections in the registry.

- [ ] **Step 1: Implement Hero Banner section with all Classic Commerce variants**

Variants for Classic Commerce (subtle animation tier): `centered_overlay`, `split_image`, `slideshow`, `minimal_text`, `video_background`. Each must be responsive, use CSS variables, and respect config props. The `parallax` hero variant requires polished+ tier and is NOT built for Classic Commerce — it will be added when a polished-tier template is implemented. Implement all tier-compatible variants per section — the full variant list is in `docs/STOREFRONT_SYSTEM_OVERHAUL.md` § Section Types.

- [ ] **Step 2: Implement Featured Products section with variants**

Variants: `standard_grid`, `spotlight_plus_grid`, `horizontal_scroll`, `masonry`, `carousel`. Uses `ProductCard` component. Renders products from `data` prop. Full variant list per spec.

- [ ] **Step 3: Implement Product Grid section with variants**

Variants: `standard_grid`, `sidebar_filters`, `grid_list_toggle`, `infinite_scroll`. Includes client-side filtering/sorting via AJAX. Uses `ProductCard`. Full variant list per spec.

- [ ] **Step 4: Implement Category Grid section with variants**

Variants: `image_overlay`, `image_above`, `chips`, `icon_grid`, `carousel`. Full variant list per spec.

- [ ] **Step 5: Implement all content sections**

Rich Text, Image With Text (with variants), Testimonials (with variants), FAQ, Contact Form (with variants).

- [ ] **Step 6: Implement all remaining sections**

Announcement Bar, Newsletter Signup (with variants), Banner, Spacer, Gallery (with variants), Video (with variants), Logo Cloud, Countdown, Collection List (with variants), Recently Viewed, Map.

- [ ] **Step 7: Register all sections in registry.ts**

- [ ] **Step 8: Run TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 9: Commit**

```bash
git add resources/js/storefront/sections/
git commit -m "feat(storefront): implement all 20 section React components with layout variants for Classic Commerce"
```

---

## Chunk 5: Builder Backend

### Task 12: StorefrontBuilderService

**Files:**
- Create: `app/Services/Storefront/StorefrontBuilderService.php`
- Test: `tests/Feature/Services/Storefront/StorefrontBuilderServiceTest.php`

**Reference:** Spec § StorefrontBuilderService methods.

- [ ] **Step 1: Write tests for builder service**

Test: `initializeStorefront()` creates config + default pages from theme's `default_sections`. Test: `addSectionToPage()` adds section to page's sections array at correct position. Test: `updateSectionConfig()` updates the right section. Test: `removeSectionFromPage()` removes section. Test: `reorderSections()` reorders by array of IDs. Test: `publish()` sets `is_published` and `published_at`. Test: `resetToThemeDefaults()` resets overrides.

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement StorefrontBuilderService**

All methods operate on `StorefrontConfig` and `StorefrontPage` models. Section manipulation methods work on the `sections` JSONB array — find by section `id`, splice, reorder.

Use `DB::transaction()` for `initializeStorefront()` which creates config + multiple pages.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add app/Services/Storefront/StorefrontBuilderService.php tests/Feature/Services/Storefront/StorefrontBuilderServiceTest.php
git commit -m "feat(storefront): implement builder service for storefront configuration and page management"
```

---

### Task 13: Builder Controller & FormRequests

**Files:**
- Create: `app/Http/Controllers/Admin/StorefrontBuilderController.php`
- Create: `app/Http/Requests/Storefront/UpdateStorefrontConfigRequest.php`
- Create: `app/Http/Requests/Storefront/UpdateStorefrontPageRequest.php`
- Create: `app/Http/Requests/Storefront/AddSectionRequest.php`
- Create: `app/Http/Requests/Storefront/UpdateSectionRequest.php`
- Create: `app/Http/Requests/Storefront/ReorderSectionsRequest.php`
- Create: `app/Http/Requests/Storefront/UploadMediaRequest.php`
- Modify: `routes/web.php` — add builder admin routes
- Test: `tests/Feature/Http/Controllers/Admin/StorefrontBuilderControllerTest.php`

**Reference:** Spec § Builder Controller. Each endpoint is thin — validate via FormRequest, authorize via Gate, delegate to service, return response.

- [ ] **Step 1: Write controller tests**

```php
<?php

use App\Models\Tenant;
use App\Models\Shop;
use App\Models\User;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\StorefrontConfig;
use App\Models\StorefrontPage;
use App\Enums\UserRole;
use App\Enums\StorefrontPageType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\StorefrontTemplateSeeder::class);
    $this->tenant = Tenant::factory()->create();
    $this->shop = Shop::factory()->create(['tenant_id' => $this->tenant->id, 'storefront_enabled' => true]);
    $this->owner = User::factory()->create(['tenant_id' => $this->tenant->id, 'role' => UserRole::OWNER]);
    $this->cashier = User::factory()->create(['tenant_id' => $this->tenant->id, 'role' => UserRole::CASHIER]);
    $this->template = StorefrontTemplate::query()->where('slug', 'classic-commerce')->first();
    $this->theme = $this->template->themes()->first();
});

it('selects theme and initializes storefront', function () {
    $this->actingAs($this->owner)
        ->postJson(route('admin.storefront.builder.theme', $this->shop), [
            'theme_id' => $this->theme->id,
        ])
        ->assertOk();

    expect($this->shop->fresh()->storefrontConfig)->not->toBeNull();
});

it('returns builder data with config and section manifest', function () {
    StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);

    $response = $this->actingAs($this->owner)
        ->getJson(route('admin.storefront.builder.data', $this->shop))
        ->assertOk();

    $response->assertJsonStructure(['config', 'pages', 'sectionManifest']);
});

it('prevents cashiers from accessing builder', function () {
    $this->actingAs($this->cashier)
        ->getJson(route('admin.storefront.builder.data', $this->shop))
        ->assertForbidden();
});

it('prevents cross-tenant access to builder', function () {
    $otherTenant = Tenant::factory()->create();
    $otherUser = User::factory()->create(['tenant_id' => $otherTenant->id, 'role' => UserRole::OWNER]);

    $this->actingAs($otherUser)
        ->getJson(route('admin.storefront.builder.data', $this->shop))
        ->assertForbidden();
});

it('adds section to page', function () {
    $config = StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
    ]);
    StorefrontPage::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'storefront_config_id' => $config->id,
        'page_type' => StorefrontPageType::HOME,
        'sections' => [],
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('admin.storefront.builder.section.add', [$this->shop, 'home']), [
            'type' => 'hero_banner',
            'variant' => 'centered_overlay',
        ])
        ->assertOk();

    $page = StorefrontPage::query()->where('shop_id', $this->shop->id)->first();
    expect($page->sections)->toHaveCount(1);
    expect($page->sections[0]['type'])->toBe('hero_banner');
});

it('publishes storefront', function () {
    StorefrontConfig::factory()->create([
        'tenant_id' => $this->tenant->id,
        'shop_id' => $this->shop->id,
        'theme_id' => $this->theme->id,
        'is_published' => false,
    ]);

    $this->actingAs($this->owner)
        ->postJson(route('admin.storefront.builder.publish', $this->shop))
        ->assertOk();

    expect($this->shop->fresh()->storefrontConfig->is_published)->toBeTrue();
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Create all FormRequest classes**

Follow existing pattern: `authorize()` returns `true`, array-style rules.

`AddSectionRequest`:
```php
public function rules(): array
{
    return [
        'type' => ['required', 'string', 'max:50'],
        'variant' => ['required', 'string', 'max:50'],
        'position' => ['nullable', 'integer', 'min:0'],
    ];
}
```

`UpdateSectionRequest`:
```php
public function rules(): array
{
    return [
        'config' => ['required', 'array'],
        'variant' => ['nullable', 'string', 'max:50'],
        'scroll_animation' => ['nullable', 'string', 'max:50'],
    ];
}
```

`ReorderSectionsRequest`:
```php
public function rules(): array
{
    return [
        'section_ids' => ['required', 'array'],
        'section_ids.*' => ['required', 'string'],
    ];
}
```

- [ ] **Step 4: Create StorefrontBuilderController**

Thin controller following project pattern. Constructor-inject `StorefrontBuilderService` and `SectionTypeRegistry`.

**CRITICAL:** Every method must call `Gate::authorize('configureSettings', $shop)` before delegating to the service. The existing `StorefrontPolicy::configureSettings()` restricts access to Owner, GM, SM, and AM roles with shop assignment.

Key methods:
- `index()` — `Gate::authorize('configureSettings', $shop)`, then `Inertia::render('Admin/Storefront/Builder', [...])`
- `getBuilderData()` — `Gate::authorize('configureSettings', $shop)`, returns config, pages, theme manifest
- `selectTheme()` — `Gate::authorize('configureSettings', $shop)`, initializes storefront via service
- `updateConfig()` — `Gate::authorize('configureSettings', $shop)`, saves theme overrides
- `addSection()`, `updateSection()`, `removeSection()`, `reorderSections()` — `Gate::authorize('configureSettings', $shop)`, section CRUD
- `publish()`, `unpublish()` — `Gate::authorize('configureSettings', $shop)`, publish flow
- `preview()` — `Gate::authorize('configureSettings', $shop)`, renders storefront in preview mode (bypasses is_published check)

- [ ] **Step 4b: Create API Resources for builder responses**

Create: `app/Http/Resources/StorefrontConfigResource.php`, `StorefrontPageResource.php`, `StorefrontThemeResource.php`, `StorefrontTemplateResource.php`. Follow existing Resource pattern. Use `whenLoaded()` for relationships. The builder's `getBuilderData()` and `getPage()` endpoints must shape responses through Resources, not raw model arrays.

- [ ] **Step 5: Add admin routes**

In `routes/web.php`, under admin middleware group:

```php
Route::prefix('admin/storefront')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/builder/{shop}', [StorefrontBuilderController::class, 'index'])->name('admin.storefront.builder');
    Route::get('/builder/{shop}/data', [StorefrontBuilderController::class, 'getBuilderData'])->name('admin.storefront.builder.data');
    Route::post('/builder/{shop}/theme', [StorefrontBuilderController::class, 'selectTheme'])->name('admin.storefront.builder.theme');
    Route::put('/builder/{shop}/config', [StorefrontBuilderController::class, 'updateConfig'])->name('admin.storefront.builder.config');
    Route::get('/builder/{shop}/page/{pageType}', [StorefrontBuilderController::class, 'getPage'])->name('admin.storefront.builder.page');
    Route::post('/builder/{shop}/page/{pageType}/section', [StorefrontBuilderController::class, 'addSection'])->name('admin.storefront.builder.section.add');
    Route::put('/builder/{shop}/page/{pageType}/section/{sectionId}', [StorefrontBuilderController::class, 'updateSection'])->name('admin.storefront.builder.section.update');
    Route::delete('/builder/{shop}/page/{pageType}/section/{sectionId}', [StorefrontBuilderController::class, 'removeSection'])->name('admin.storefront.builder.section.remove');
    Route::put('/builder/{shop}/page/{pageType}/reorder', [StorefrontBuilderController::class, 'reorderSections'])->name('admin.storefront.builder.section.reorder');
    Route::post('/builder/{shop}/publish', [StorefrontBuilderController::class, 'publish'])->name('admin.storefront.builder.publish');
    Route::post('/builder/{shop}/unpublish', [StorefrontBuilderController::class, 'unpublish'])->name('admin.storefront.builder.unpublish');
    Route::get('/builder/{shop}/preview/{pageType}', [StorefrontBuilderController::class, 'preview'])->name('admin.storefront.builder.preview');
    Route::post('/builder/{shop}/media', [StorefrontBuilderController::class, 'uploadMedia'])->name('admin.storefront.builder.media.upload');
    Route::delete('/builder/{shop}/media/{media}', [StorefrontBuilderController::class, 'deleteMedia'])->name('admin.storefront.builder.media.delete');
});
```

- [ ] **Step 6: Run tests — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/StorefrontBuilderController.php app/Http/Requests/Storefront/ app/Http/Resources/Storefront* routes/web.php tests/Feature/Http/Controllers/Admin/
git commit -m "feat(storefront): add builder controller, form requests, API resources, and admin routes"
```

---

## Chunk 6: Builder Frontend

### Task 14: Builder Page & Core Components

**Files:**
- Create: `resources/js/pages/Admin/Storefront/Builder.tsx`
- Create: `resources/js/pages/Admin/Storefront/TemplateSelector.tsx`
- Create: `resources/js/pages/Admin/Storefront/ThemeSelector.tsx`
- Create: `resources/js/pages/Admin/Storefront/components/SectionPalette.tsx`
- Create: `resources/js/pages/Admin/Storefront/components/SectionCanvas.tsx`
- Create: `resources/js/pages/Admin/Storefront/components/SectionConfigPanel.tsx`
- Create: `resources/js/pages/Admin/Storefront/components/ThemeConfigPanel.tsx`
- Create: `resources/js/pages/Admin/Storefront/components/PreviewFrame.tsx`
- Create: `resources/js/pages/Admin/Storefront/components/config-fields/` (17 field components including SlideListField)
- Create: `resources/js/pages/Admin/Storefront/types/builder.ts`

**Reference:** Spec § Builder UI. Use `/frontend-design` skill for the Builder page — this is the admin tool shop owners will spend the most time in. It must feel premium.

**IMPORTANT:** Install `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop in the builder. `react-dnd` is installed but dnd-kit has a better API for sortable lists.

**This task is large — split across subagents:**
- **Subagent A:** Builder.tsx, TemplateSelector.tsx, ThemeSelector.tsx, builder types
- **Subagent B:** SectionPalette, SectionCanvas (drag-and-drop)
- **Subagent C:** SectionConfigPanel, all 16 config field components
- **Subagent D:** ThemeConfigPanel, PreviewFrame

- [ ] **Step 1: Install dnd-kit**

Run: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

- [ ] **Step 2: Create builder TypeScript types**

Types for builder state, section manifest, config field schemas, drag-and-drop state.

- [ ] **Step 3: Create Builder.tsx main page**

Inertia page component. Three-panel layout: left (SectionPalette), center (SectionCanvas + PreviewFrame toggle), right (SectionConfigPanel or ThemeConfigPanel). Top bar with page selector, preview button, publish button.

State management: useForm for config updates, useState for selected section, UI state.

- [ ] **Step 4: Create TemplateSelector and ThemeSelector**

TemplateSelector: shown first if no config exists. Grid of template cards with previews. ThemeSelector: shown after template selection. Grid of 6 theme cards per template.

- [ ] **Step 5: Create SectionPalette**

Draggable section type cards grouped by category. Uses dnd-kit `useDraggable`. Filtered by current template's supported sections.

- [ ] **Step 6: Create SectionCanvas**

Sortable list of section cards. Uses dnd-kit `useSortable`. Each card shows section type icon, name, mini-preview. Drag handle. Visibility toggle. Delete button. Click to select → opens config panel.

- [ ] **Step 7: Create SectionConfigPanel with dynamic form generation**

Reads section's `configSchema` from the manifest. Renders appropriate field component for each config field. Includes variant selector at top.

- [ ] **Step 8: Create all config field components**

17 components per spec: TextField, PresetColorPicker, SelectField, ToggleField, NumberField, SliderField, ImageUploadField, ImageListField, RichTextField (Tiptap), ProductPickerField, CategoryPickerField, TestimonialListField, FaqListField, CollectionListField, SlideListField, DateTimeField, VariantSelectorField.

- [ ] **Step 9: Create ThemeConfigPanel**

Guardrailed customization panel. Color preset selector (shows theme's curated palettes as clickable swatches). Typography preset selector. Component style options (button shape, card style, etc. — rendered from theme's `_options` arrays). Feel options. Animation options. Header/footer variant pickers.

- [ ] **Step 10: Create PreviewFrame**

Iframe pointing to preview route. Refreshes on config changes (debounced 500ms). Responsive size toggle (desktop/tablet/mobile).

- [ ] **Step 11: Run TypeScript check**

- [ ] **Step 12: Commit**

```bash
git add resources/js/pages/Admin/Storefront/ package.json package-lock.json
git commit -m "feat(storefront): add builder UI with drag-and-drop canvas, config panels, and live preview"
```

---

## Chunk 7: Classic Commerce Themes & Seeding

### Task 15: Seed Classic Commerce Template + 6 Themes

**Files:**
- Create: `database/seeders/StorefrontTemplateSeeder.php`

**Reference:** Spec § Template 1: Classic Commerce and its 6 themes table. The seeder creates the platform-level template and theme records with complete `theme_config` data objects.

- [ ] **Step 1: Create seeder with Classic Commerce template**

Full `structural_config` per spec. `supported_sections` = all 20 section types. `supported_pages` = all page types. `animation_tier` = `subtle`. `navigation_pattern` = `standard`.

- [ ] **Step 2: Create Lagos Express theme config**

Complete `theme_config` object with: 4 color palette presets, 3 typography options, component defaults + options, feel defaults + options, animation config, header/footer/hero/product_card/decoration config. Plus `default_sections` for a home page (hero + featured products + category grid + testimonials + newsletter + spacer).

- [ ] **Step 3: Create remaining 5 theme configs**

Sunshine Market, Abuja Fresh, Crystal Clear, Naija Vibrant, Metro Professional. Each with distinct palette presets, typography pairings, component styles, and default sections.

- [ ] **Step 4: Run seeder**

Run: `php artisan db:seed --class=StorefrontTemplateSeeder`

- [ ] **Step 5: Verify seeded data**

Run: `php artisan tinker` → check `StorefrontTemplate::count()` = 1, `StorefrontTheme::count()` = 6.

- [ ] **Step 6: Commit**

```bash
git add database/seeders/StorefrontTemplateSeeder.php
git commit -m "feat(storefront): seed Classic Commerce template with 6 complete theme configs"
```

---

## Chunk 8: Integration & Polish

### Task 16: Caching Layer

**Files:**
- Modify: `app/Services/Storefront/StorefrontRenderService.php` — add caching
- Modify: `app/Services/Storefront/StorefrontBuilderService.php` — add cache invalidation
- Test: `tests/Feature/Services/Storefront/StorefrontCachingTest.php`

**Reference:** Spec § Caching Strategy.

- [ ] **Step 1: Write caching tests**

Test: rendered page is cached. Test: cache is invalidated when config changes. Test: cache is invalidated when sections change. Test: cache is invalidated when products change.

- [ ] **Step 2: Add cache reads in RenderService**

Use `Cache::remember()` with keys:
- `storefront:{shop_id}:config` — resolved theme config (60 min)
- `storefront:{shop_id}:page:{type}` — resolved page (15 min)
- `storefront:{shop_id}:navigation` — navigation links (60 min)

- [ ] **Step 3: Add cache invalidation in BuilderService**

After any config/page change, flush relevant cache keys.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add app/Services/Storefront/ tests/Feature/Services/Storefront/StorefrontCachingTest.php
git commit -m "feat(storefront): add caching layer with tenant-aware keys and invalidation"
```

---

### Task 17: Media Management

**Files:**
- Create: `app/Services/Storefront/StorefrontMediaService.php`
- Test: `tests/Feature/Services/Storefront/StorefrontMediaServiceTest.php`

- [ ] **Step 1: Write media service tests**

Test: upload creates `StorefrontMedia` record and stores file. Test: delete removes record and file. Test: image is resized/optimized on upload.

- [ ] **Step 2: Implement StorefrontMediaService**

Methods: `upload()`, `delete()`. Upload should: validate file type, resize/optimize using Intervention Image (already in project), store to `storefront/{shop_id}/` path on the `public` disk, create `StorefrontMedia` record, return path. Add a `storefront` disk in `config/filesystems.php` if a dedicated disk is preferred, or use `public` with the `storefront/` prefix.

- [ ] **Step 3: Run tests — expect PASS**

- [ ] **Step 4: Commit**

```bash
git add app/Services/Storefront/StorefrontMediaService.php tests/Feature/Services/Storefront/StorefrontMediaServiceTest.php
git commit -m "feat(storefront): add media service with upload, resize, and deletion"
```

---

### Task 18: E2E Smoke Test

**Files:**
- Test: `tests/Feature/Storefront/StorefrontBuilderE2ETest.php`

**Reference:** Full end-to-end test: create shop → select template → select theme → add sections → configure → publish → render public page.

- [ ] **Step 1: Write E2E test**

```php
<?php

use App\Models\Tenant;
use App\Models\Shop;
use App\Models\User;
use App\Models\StorefrontTemplate;
use App\Models\StorefrontTheme;
use App\Models\Product;
use App\Enums\StorefrontPageType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('completes full builder flow: template → theme → sections → publish → render', function () {
    $this->seed(\Database\Seeders\StorefrontTemplateSeeder::class);

    $tenant = Tenant::factory()->create();
    $shop = Shop::factory()->create(['tenant_id' => $tenant->id, 'storefront_enabled' => true]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    Product::factory()->count(5)->create([
        'tenant_id' => $tenant->id,
        'shop_id' => $shop->id,
        'is_active' => true,
        'is_featured' => true,
    ]);

    $template = StorefrontTemplate::query()->where('slug', 'classic-commerce')->firstOrFail();
    $theme = $template->themes()->where('slug', 'lagos-express')->firstOrFail();

    $this->actingAs($user)
        ->postJson(route('admin.storefront.builder.theme', $shop), ['theme_id' => $theme->id])
        ->assertOk();

    $shop->refresh();
    expect($shop->storefrontConfig)->not->toBeNull();
    expect($shop->storefrontConfig->theme_id)->toBe($theme->id);

    $this->actingAs($user)
        ->postJson(route('admin.storefront.builder.section.add', [$shop, 'home']), [
            'type' => 'hero_banner',
            'variant' => 'centered_overlay',
        ])
        ->assertOk();

    $this->actingAs($user)
        ->postJson(route('admin.storefront.builder.publish', $shop))
        ->assertOk();

    $shop->refresh();
    expect($shop->storefrontConfig->is_published)->toBeTrue();

    $this->get("/store/{$shop->slug}")
        ->assertOk()
        ->assertViewIs('storefront.builder-app');
});
```

- [ ] **Step 2: Run test — expect PASS**

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Storefront/StorefrontBuilderE2ETest.php
git commit -m "test(storefront): add E2E smoke test for complete builder flow"
```

---

## Summary

| Task | Description | Dependencies | Parallelizable |
|------|-------------|-------------|----------------|
| 0 | Populate prerequisite factories | None | First |
| 1 | Enums | Task 0 | Yes |
| 2 | Migrations | Task 0 | Yes (with Task 1) |
| 3 | Models & Storefront Factories | Tasks 1, 2 | No |
| 4 | Interface & Registry | Task 1 | Yes (with Task 3) |
| 5 | Section PHP Classes | Tasks 3, 4 | No |
| 6 | RenderService | Tasks 3, 4, 5 | No |
| 7 | RenderController + Blade + Routes | Task 6 | No |
| 8 | TypeScript Types + React Entry | None | Yes (with Tasks 1-7) |
| 9 | ThemeProvider + AnimationProvider | Task 8 | No |
| 10 | Classic Commerce Layout + Components | Task 9 | No |
| 11 | Section React Components | Tasks 9, 10 | **Split across 3 subagents** |
| 12 | BuilderService | Tasks 3, 5 | Yes (with Tasks 8-11) |
| 13 | BuilderController + FormRequests + Resources | Task 12 | No |
| 14 | Builder Frontend | Tasks 8, 13 | **Split across 4 subagents** |
| 15 | Seed Classic Commerce | Tasks 2, 3 | Yes (with Tasks 4-14) |
| 16 | Caching | Tasks 6, 12 | No |
| 17 | Media Management | Task 3 | Yes (with most tasks) |
| 18 | E2E Smoke Test | All above | No |

**Critical path:** Task 0 first, then Tasks 1→2→3→4→5→6→7 (backend pipeline) and Tasks 8→9→10→11 (frontend pipeline) can run in parallel after Task 3.

**Estimated commit count:** 19 commits across the implementation.
