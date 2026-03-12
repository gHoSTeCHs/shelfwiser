# ShelfWiser Dynamic Storefront Builder — Technical Spec

## Vision

Every shop on ShelfWiser gets a storefront that looks and feels like it was custom-built. In a thousand shops, no two should look the same. Shop owners pick a template (structural layout system), choose a theme (complete aesthetic identity), customize within guardrails (curated colors, fonts, effects), compose their pages from section types, and publish — all without writing code.

The system draws architectural patterns from **Amoriie**, which implements a template/theme/customization hierarchy: Templates define structure, Themes define aesthetic identity within that structure, and Customization lets users personalize within theme-safe guardrails. The same pattern applies here at e-commerce scale.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.2+, PostgreSQL
- **Frontend (Admin/Builder):** React 19, TypeScript, Tailwind CSS, Inertia.js v2
- **Frontend (Storefront):** React 19, TypeScript, Tailwind CSS — rendered via Blade bootstrap (NOT Inertia)
- **Animation:** GSAP (ScrollTrigger, timelines), Framer Motion (React primitives), Lenis (smooth scroll)
- **3D (Premium):** React Three Fiber, @react-three/drei, GLB/glTF models
- **Existing Libraries:** dnd-kit, Tiptap, Intervention Image, DomPDF

## Architecture Principles

1. **No Docker.** All services run natively.
2. **Service layer architecture.** Controllers are thin, business logic in services.
3. **Template → Theme → Customization hierarchy.** Three distinct layers. Template = structural skeleton. Theme = complete aesthetic package. Customization = user overrides within theme guardrails.
4. **Shared scaffold, theme-driven variation.** One set of section components serves all themes within a template. The theme config object drives all visual/behavioral differences. Minimal code duplication.
5. **Guardrailed customization.** Users feel unlimited freedom, but every choice stays within the theme's curated palette, font list, and style options. Ugly combinations are structurally impossible.
6. **Multi-tenancy via global scopes.** All tenant-scoped models use `BelongsToTenant` trait.
7. **Admin dashboard stays on Inertia.** Builder UI is part of the Inertia admin.
8. **Public storefront is decoupled from Inertia.** Blade view bootstraps standalone React app with JSON page data.
9. **One template at a time.** Build each template end-to-end with full quality before starting the next. No half-implementations.

## How the System Works — High Level

```
SHOP OWNER (Admin Panel, Inertia)          CUSTOMER (Public Storefront, Decoupled)
         │                                              │
         ▼                                              ▼
┌─────────────────────┐                    ┌─────────────────────────┐
│  Storefront Builder │                    │  StorefrontRenderController │
│  ─────────────────  │                    │  ───────────────────────── │
│  1. Pick a template │                    │  1. Resolve shop by slug   │
│  2. Pick a theme    │   Saves JSON       │  2. Load template + theme  │
│  3. Customize within│──────────────►     │  3. Load config overrides  │
│     theme guardrails│   to database      │  4. Load page definition   │
│  4. Add/reorder     │                    │  5. Resolve section data   │
│     sections        │                    │  6. Inject into Blade view │
│  5. Configure each  │                    │  7. React hydrates page    │
│     section         │                    └─────────────────────────┘
│  6. Preview & pub   │
└─────────────────────┘
```

---

## The Three-Layer Hierarchy

```
TEMPLATE (structural skeleton)
│   Defines: layout system, navigation pattern, scroll behavior,
│   animation tier, section flow, available section types
│
└── THEME (complete aesthetic package within template)
    │   Defines: color palette arrays, font families, component variants,
    │   hover behaviors, entrance animations, spacing rhythm, decorations
    │   Each template ships with 6 themes.
    │
    └── CUSTOMIZATION (shop overrides within theme guardrails)
            User picks from: theme's curated color presets, theme's font options,
            theme's component style options. Plus: logo, content, section composition.
            Advanced users get custom CSS escape hatch.
```

### Why Three Layers

**Templates alone** = structural diversity but visually monotonous within a template.
**Themes alone** (current spec) = visual variety but structurally identical sites.
**Templates + Themes + Guardrailed Customization** = structural diversity × aesthetic diversity × personal branding = effectively infinite unique combinations.

**The math:**

- 6 templates × 6 themes each = 36 base presets
- × section composition (which of 20+ sections, in what order) = combinatorial explosion
- × section layout variants (3-6 per section type)
- × global feel tokens (shadow × button shape × image treatment × animation speed)
- × curated color customization (4-6 palette presets per theme, plus custom)
- × typography options (2-3 heading × 2-3 body fonts per theme)
- = **millions of distinct combinations**

1,000 unique sites isn't the ceiling — it's the floor.

---

## Data Models

### StorefrontTemplate (NEW)

Platform-level structural skeletons. Each template defines a fundamentally different layout system, navigation pattern, scroll behavior, and animation capability.

**Table:** `storefront_templates`

```
id                  - uuid, PK
name                - string (e.g., "Classic Commerce", "Editorial Showcase")
slug                - string, unique
description         - text
category            - StorefrontTemplateCategory enum
structural_config   - jsonb (layout system definition)
animation_tier      - StorefrontAnimationTier enum
supported_sections  - jsonb (which section types this template supports)
supported_pages     - jsonb (which page types this template supports)
navigation_pattern  - string (standard, overlay, mega_menu, minimal, sidebar)
scroll_behavior     - string (standard, smooth, parallax, scroll_driven)
is_premium          - boolean, default: false
is_active           - boolean, default: true
sort_order          - integer, default: 0
created_at          - timestamp
updated_at          - timestamp
```

**No tenant_id.** Templates are platform-level resources.

**Template Category Enum — `StorefrontTemplateCategory`:**

| Case        | Value       | Description                         |
| ----------- | ----------- | ----------------------------------- |
| Commerce    | commerce    | Traditional e-commerce layouts      |
| Editorial   | editorial   | Magazine/lookbook style             |
| Marketplace | marketplace | High-volume, dense display          |
| Immersive   | immersive   | Scroll-driven cinematic experiences |
| Catalog     | catalog     | Search-first, filter-heavy          |
| Storyteller | storyteller | Narrative-driven brand showcase     |
| Service     | service     | Booking, appointments, menus        |
| Content     | content     | Blog, courses, directories          |
| Campaign    | campaign    | Launches, seasonal, time-bound      |
| Social      | social      | Community, UGC, social selling      |
| Specialty   | specialty   | Subscriptions, property, micro-shop |

**Animation Tier Enum — `StorefrontAnimationTier`:**

| Case      | Value     | Description                                             | Libraries                              |
| --------- | --------- | ------------------------------------------------------- | -------------------------------------- |
| None      | none      | No animations. Fast, accessible.                        | —                                      |
| Subtle    | subtle    | Fade-in on scroll, smooth hover states                  | CSS transitions + IntersectionObserver |
| Polished  | polished  | Staggered reveals, parallax images, elegant transitions | Framer Motion + Lenis                  |
| Cinematic | cinematic | ScrollTrigger, scroll-pinning, 3D transforms, video     | GSAP + Lenis + Three.js (optional)     |

**Structural Config JSON:**

```json
{
    "layout_system": "container_stack",
    "container_max_width": "1280px",
    "section_flow": "vertical",
    "header_anatomy": {
        "variants": ["standard", "centered_logo", "transparent_overlay"],
        "supports_mega_menu": false,
        "supports_sticky": true,
        "supports_search_bar": true
    },
    "footer_anatomy": {
        "variants": ["multi_column", "minimal", "centered", "mega_footer"]
    },
    "hero_variants": [
        "centered_overlay",
        "split_image",
        "slideshow",
        "minimal_text",
        "video_background"
    ],
    "product_display_modes": ["grid", "masonry"],
    "section_transition": "none",
    "supports_sidebar": false,
    "supports_parallax": false,
    "supports_scroll_pinning": false,
    "supports_3d_viewer": false,
    "supports_horizontal_scroll": false
}
```

**Relationships:**

- `themes()` → HasMany StorefrontTheme

---

### StorefrontTheme (REVISED)

Theme is now scoped to a template. Each theme defines a complete aesthetic identity — not just colors, but behavioral differences: which animation variants fire, which component shapes render, which hover effects apply. Following Amoriie's pattern, the theme config is a pure data object that drives all visual/behavioral differences through a shared scaffold.

**Table:** `storefront_themes`

```
id                  - uuid, PK
template_id         - foreignId → storefront_templates
name                - string (e.g., "Lagos Express", "Eko Luxe")
slug                - string, unique
description         - text, nullable
thumbnail_path      - string, nullable
ideal_for           - string, nullable (e.g., "Electronics, general retail, pharmacy")
theme_config        - jsonb (THE config object — palette, typography, component variants, animations, decorations)
default_sections    - jsonb (default page sections when selecting this theme)
is_premium          - boolean, default: false
is_active           - boolean, default: true
sort_order          - integer, default: 0
created_at          - timestamp
updated_at          - timestamp
```

**No tenant_id.** Themes are platform-level.

**Theme Config JSON — the complete aesthetic package:**

```json
{
    "palette": {
        "presets": [
            {
                "name": "Default",
                "primary": "#e94560",
                "secondary": "#1a1a2e",
                "accent": "#f97316",
                "background": "#ffffff",
                "surface": "#f8f9fa",
                "text": "#1a1a2e",
                "text_muted": "#6b7280",
                "border": "#e5e7eb",
                "header_bg": "#ffffff",
                "header_text": "#1a1a2e",
                "footer_bg": "#1a1a2e",
                "footer_text": "#ffffff",
                "button_bg": "#e94560",
                "button_text": "#ffffff",
                "button_hover_bg": "#d63851",
                "badge_bg": "#e94560",
                "badge_text": "#ffffff",
                "sale_color": "#dc2626",
                "success": "#16a34a",
                "error": "#dc2626"
            },
            {
                "name": "Ocean",
                "primary": "#0ea5e9",
                "secondary": "#0c4a6e",
                "accent": "#f59e0b",
                "background": "#ffffff",
                "surface": "#f0f9ff",
                "text": "#0c4a6e",
                "..."
            },
            {
                "name": "Forest",
                "...": "..."
            },
            {
                "name": "Sunset",
                "...": "..."
            }
        ],
        "allow_custom": false
    },

    "typography": {
        "options": [
            {
                "name": "Default",
                "heading_font": "DM Sans",
                "body_font": "DM Sans",
                "heading_weight": "700",
                "body_weight": "400"
            },
            {
                "name": "Editorial",
                "heading_font": "Playfair Display",
                "body_font": "DM Sans",
                "heading_weight": "700",
                "body_weight": "400"
            },
            {
                "name": "Friendly",
                "heading_font": "Outfit",
                "body_font": "DM Sans",
                "heading_weight": "600",
                "body_weight": "400"
            }
        ],
        "base_size": 16,
        "line_height": 1.6,
        "heading_line_height": 1.2,
        "letter_spacing": "normal"
    },

    "components": {
        "button_style": "rounded",
        "button_options": ["sharp", "rounded", "pill"],
        "card_style": "elevated",
        "card_options": ["flat", "bordered", "elevated", "glass"],
        "image_style": "rounded",
        "image_options": ["sharp", "rounded", "circle"],
        "badge_style": "pill",
        "badge_options": ["pill", "square", "outlined"],
        "input_style": "bordered",
        "input_options": ["bordered", "underline", "filled"]
    },

    "feel": {
        "shadow_depth": "subtle",
        "shadow_options": ["none", "subtle", "medium", "dramatic"],
        "border_radius": "8px",
        "border_radius_options": ["0px", "4px", "8px", "12px", "16px", "9999px"],
        "section_spacing": "64px",
        "spacing_options": ["32px", "48px", "64px", "80px", "96px"],
        "divider_style": "none",
        "divider_options": ["none", "thin_line", "thick_line", "gradient", "ornament"]
    },

    "animation": {
        "entrance_style": "fade_up",
        "entrance_options": ["none", "fade_up", "fade_in", "slide_left", "slide_right", "zoom_in", "blur_in"],
        "hover_style": "elevate",
        "hover_options": ["none", "elevate", "glow", "scale", "border_accent", "underline"],
        "page_transition": "fade",
        "page_transition_options": ["none", "fade", "slide", "morph"],
        "stagger_delay": 80,
        "duration_multiplier": 1.0
    },

    "header": {
        "variant": "standard",
        "position": "sticky",
        "transparent_on_hero": false
    },

    "footer": {
        "variant": "multi_column",
        "show_newsletter": true,
        "show_social_links": true
    },

    "hero": {
        "default_variant": "centered_overlay",
        "default_height": "large",
        "overlay_opacity": 0.4
    },

    "product_card": {
        "variant": "default",
        "show_quick_add": true,
        "image_aspect_ratio": "4:5",
        "hover_effect": "image_zoom"
    },

    "decorations": {
        "background_pattern": "none",
        "pattern_options": ["none", "dots", "grid", "diagonal", "noise"],
        "pattern_opacity": 0.05,
        "section_dividers": false,
        "ornaments": false
    }
}
```

**Key insight:** Every `_options` array defines the guardrails. The user can only pick from these. The theme ships with sensible defaults, and every option combination looks good because the theme designer curated them.

**Relationships:**

- `template()` → BelongsTo StorefrontTemplate
- `shopConfigs()` → HasMany StorefrontConfig

---

### StorefrontConfig (REVISED)

Per-shop customization. Stores the user's choices within theme guardrails. Only stores OVERRIDES — anything not set falls back to the theme's defaults.

**Table:** `storefront_configs`

```
id                  - uuid, PK
tenant_id           - foreignId → tenants
shop_id             - foreignId → shops, unique (one config per shop)
theme_id            - foreignId → storefront_themes
color_preset        - string, nullable (name of selected palette preset, or "custom")
color_overrides     - jsonb, nullable (only populated if color_preset is "custom")
typography_preset   - string, nullable (name of selected typography option)
typography_overrides - jsonb, nullable (base_size, line_height overrides)
component_overrides - jsonb, nullable (button_style, card_style, image_style, badge_style, input_style)
feel_overrides      - jsonb, nullable (shadow_depth, border_radius, section_spacing, divider_style)
animation_overrides - jsonb, nullable (entrance_style, hover_style, stagger_delay, duration_multiplier)
header_overrides    - jsonb, nullable (variant, position, transparent_on_hero)
footer_overrides    - jsonb, nullable (variant, show_newsletter, show_social_links)
logo_path           - string, nullable
favicon_path        - string, nullable
social_links        - jsonb, nullable (array of {platform, url} objects)
global_announcement - jsonb, nullable (text, background_color, text_color, is_active, link_url, link_text)
custom_css          - text, nullable (escape hatch for power users, sanitized on save)
seo_defaults        - jsonb, nullable (default_title_suffix, meta_description, og_image_path)
is_published        - boolean, default: false
published_at        - timestamp, nullable
created_at          - timestamp
updated_at          - timestamp
```

**Traits:** `BelongsToTenant`, `HasFactory`

**Resolution logic:** Theme defaults ← Config overrides. The render service merges:

```php
$resolved = array_merge(
    $theme->theme_config['palette']['presets'][0],  // Theme default
    $config->color_overrides ?? []                   // Shop overrides
);
```

**Relationships:**

- `tenant()` → BelongsTo Tenant
- `shop()` → BelongsTo Shop
- `theme()` → BelongsTo StorefrontTheme
- `pages()` → HasMany StorefrontPage

---

### StorefrontPage

Each storefront has multiple pages. Each page contains an ordered array of sections.

**Table:** `storefront_pages`

```
id                  - uuid, PK
tenant_id           - foreignId → tenants
shop_id             - foreignId → shops
storefront_config_id - foreignId → storefront_configs
page_type           - StorefrontPageType enum
slug                - string, nullable (for custom pages only)
title               - string
sections            - jsonb (ordered array of section definitions)
seo_title           - string, nullable
seo_description     - text, nullable
seo_image_path      - string, nullable
is_published        - boolean, default: true
sort_order          - integer, default: 0
created_at          - timestamp
updated_at          - timestamp
```

**Traits:** `BelongsToTenant`, `HasFactory`

**Unique constraint:** `[shop_id, page_type]` for non-custom pages; `[shop_id, slug]` for custom pages.

**Page Type Enum — `StorefrontPageType`:**

| Case          | Value          | Description                        |
| ------------- | -------------- | ---------------------------------- |
| Home          | home           | Landing page                       |
| Products      | products       | Product listing/catalog            |
| ProductDetail | product_detail | Individual product page (template) |
| Cart          | cart           | Shopping cart                      |
| Checkout      | checkout       | Checkout flow                      |
| About         | about          | About the business                 |
| Contact       | contact        | Contact information/form           |
| Custom        | custom         | User-created custom pages          |

**Sections JSON Structure:**

Each section in the `sections` array:

```json
{
    "sections": [
        {
            "id": "sec_abc123",
            "type": "hero_banner",
            "variant": "split_image",
            "is_visible": true,
            "scroll_animation": "fade_up",
            "config": {
                "heading": "Welcome to Our Store",
                "subheading": "Quality products, great prices",
                "background_image": "/uploads/storefront/hero.jpg",
                "background_overlay": 0.4,
                "cta_text": "Shop Now",
                "cta_link": "/products",
                "text_color": "#ffffff"
            }
        },
        {
            "id": "sec_def456",
            "type": "featured_products",
            "variant": "standard_grid",
            "is_visible": true,
            "scroll_animation": "stagger",
            "config": {
                "heading": "Featured Products",
                "product_source": "featured",
                "max_items": 8,
                "columns": 4,
                "show_price": true,
                "show_add_to_cart": true
            }
        }
    ]
}
```

Note the additions: `variant` (selects the layout variant for this section type) and `scroll_animation` (per-section entrance animation, constrained by template's animation tier).

---

### StorefrontMedia

Media files uploaded through the builder.

**Table:** `storefront_media`

```
id                  - uuid, PK
tenant_id           - foreignId → tenants
shop_id             - foreignId → shops
file_path           - string
file_name           - string
mime_type           - string
file_size           - integer (bytes)
dimensions          - jsonb, nullable (width, height)
alt_text            - string, nullable
usage_context       - string, nullable
created_at          - timestamp
updated_at          - timestamp
```

**Traits:** `BelongsToTenant`, `HasFactory`

---

## Animation & Motion System

### Tier System

Each template declares an animation tier. The tier determines which animation libraries are loaded and which effects are available.

| Tier      | What Loads                      | Section Entrance             | Parallax         | Scroll Pin | 3D       | Page Transitions |
| --------- | ------------------------------- | ---------------------------- | ---------------- | ---------- | -------- | ---------------- |
| None      | Nothing                         | —                            | —                | —          | —        | —                |
| Subtle    | CSS + IntersectionObserver      | fade_up, fade_in             | —                | —          | —        | —                |
| Polished  | + Framer Motion + Lenis         | + slide, zoom, blur, stagger | Images only      | —          | —        | fade, slide      |
| Cinematic | + GSAP ScrollTrigger + Three.js | + custom timelines           | Full multi-layer | Yes        | Optional | + morph          |

### Scroll Animation Options (per section)

Available animations are gated by the template's animation tier:

```
none          - No entrance animation (all tiers)
fade_up       - Fade in while moving up (subtle+)
fade_in       - Simple opacity fade (subtle+)
slide_left    - Slide in from left (polished+)
slide_right   - Slide in from right (polished+)
zoom_in       - Scale from 0.9 to 1.0 (polished+)
blur_in       - Blur to sharp (polished+)
stagger       - Children animate in sequence (polished+)
parallax      - Parallax depth shift (polished+)
pin_and_reveal - Section pins while content reveals (cinematic only)
horizontal_scroll - Horizontal scroll section (cinematic only)
custom_timeline - GSAP timeline (cinematic only)
```

### Hover Microinteractions

Theme-defined hover behaviors for interactive elements:

```
none          - No hover effect
elevate       - Subtle lift + shadow increase
glow          - Soft glow around element
scale         - Slight scale-up (1.02-1.05)
border_accent - Border color changes to accent
underline     - Animated underline reveal
image_zoom    - Image zooms within container on hover (product cards)
tilt          - Subtle 3D tilt effect (premium)
```

### Smooth Scroll (Lenis)

Templates with `polished` or `cinematic` tier use Lenis for buttery smooth scrolling:

- Wraps the scroll container
- Configurable lerp (smoothing factor)
- Respects `prefers-reduced-motion`
- Disabled on mobile by default (native scroll is better)

### 3D Product Viewer (Premium Feature)

Available on `immersive` template only. Uses React Three Fiber:

- Shop owners upload GLB/glTF models via the builder
- 360° rotation (drag or auto-rotate)
- Pinch-to-zoom on mobile
- Hotspot annotations (clickable points for product details)
- Environment lighting presets matched to theme
- Fallback to image gallery for non-premium shops
- Future: WebXR AR preview

---

## Section Type System

### How Section Types Work

Each section type is a self-contained unit with:

1. **Config Schema** — defines builder UI controls
2. **Layout Variants** — structurally different renderings of the same section type
3. **Data Resolver** — PHP class that fetches live data
4. **React Component** — renders on the public storefront using config + data + theme + variant

### Section Type Interface

```php
<?php

namespace App\Contracts;

use App\Models\Shop;

interface StorefrontSectionInterface
{
    public function type(): string;
    public function label(): string;
    public function description(): string;
    public function category(): SectionCategory;
    public function icon(): string;

    /**
     * Available layout variants for this section type.
     * Each variant is a structurally different rendering.
     */
    public function variants(): array;

    public function configSchema(): array;
    public function defaultConfig(): array;
    public function resolveData(array $config, Shop $shop): array;
    public function allowedPageTypes(): array;
    public function maxPerPage(): int;

    /**
     * Which animation tiers support this section's scroll animations.
     */
    public function minimumAnimationTier(): StorefrontAnimationTier;
}
```

### Section Category Enum

```php
enum SectionCategory: string
{
    case HERO = 'hero';
    case PRODUCTS = 'products';
    case CONTENT = 'content';
    case SOCIAL_PROOF = 'social_proof';
    case NAVIGATION = 'navigation';
    case COMMERCE = 'commerce';
    case MEDIA = 'media';
    case LAYOUT = 'layout';
}
```

### Section Type Registry

```php
class SectionTypeRegistry
{
    private array $types = [];

    public function register(StorefrontSectionInterface $section): void;
    public function get(string $type): ?StorefrontSectionInterface;
    public function all(): array;
    public function byCategory(): array;
    public function forTemplate(StorefrontTemplate $template): array;
    public function forPageType(StorefrontPageType $pageType): array;
    public function resolveData(string $type, array $config, Shop $shop): array;
    public function getBuilderManifest(StorefrontTemplate $template): array;
}
```

`getBuilderManifest()` now accepts a template — it only returns section types that template supports, with variant options filtered by template capabilities.

---

### Section Types — Complete Definitions

#### 1. Hero Banner (`hero_banner`)

**Category:** Hero | **Max per page:** 1 | **Min tier:** Subtle

**Layout Variants:**

| Variant            | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `centered_overlay` | Full-width image, centered text overlay                             |
| `split_image`      | Image on one side, text + CTA on the other (50/50 or 60/40)         |
| `slideshow`        | Multiple slides with auto-advance, navigation dots                  |
| `minimal_text`     | Large typography, minimal/no image, background color                |
| `video_background` | Looping video background with text overlay (polished+ tier)         |
| `asymmetric`       | Off-center text, image cropped asymmetrically (editorial templates) |

**Config Schema:**

| Field                 | Type                                  | Default                | Description                                                                      |
| --------------------- | ------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| heading               | text                                  | "Welcome to Our Store" | Main heading                                                                     |
| subheading            | text                                  | ""                     | Secondary text                                                                   |
| background_type       | select: image, color, gradient, video | "image"                | Background style                                                                 |
| background_image      | image_upload                          | null                   | Background image                                                                 |
| background_video_url  | text                                  | ""                     | Video URL (for video variant)                                                    |
| background_color      | color_preset                          | theme default          | Solid background                                                                 |
| gradient_from         | color_preset                          | theme default          | Gradient start                                                                   |
| gradient_to           | color_preset                          | theme default          | Gradient end                                                                     |
| background_overlay    | slider (0-1)                          | 0.4                    | Overlay opacity                                                                  |
| cta_text              | text                                  | "Shop Now"             | Primary button text                                                              |
| cta_link              | text                                  | "/products"            | Primary button link                                                              |
| cta_secondary_text    | text                                  | ""                     | Optional second button                                                           |
| cta_secondary_link    | text                                  | ""                     | Second button link                                                               |
| height                | select: small, medium, large, full    | "large"                | Section height                                                                   |
| text_alignment        | select: left, center, right           | "center"               | Text alignment                                                                   |
| text_color            | color_preset                          | "#ffffff"              | Text color                                                                       |
| show_scroll_indicator | toggle                                | false                  | Down arrow hint                                                                  |
| slides                | slide_list                            | []                     | For slideshow variant: array of {image, heading, subheading, cta_text, cta_link} |

**Data Resolver:** None (static content).

---

#### 2. Featured Products (`featured_products`)

**Category:** Products | **Max per page:** 3 | **Min tier:** None

**Layout Variants:**

| Variant               | Description                            |
| --------------------- | -------------------------------------- |
| `standard_grid`       | Even grid of product cards             |
| `spotlight_plus_grid` | One large featured card + smaller grid |
| `horizontal_scroll`   | Horizontally scrollable product row    |
| `masonry`             | Pinterest-style variable-height grid   |
| `carousel`            | Card carousel with navigation arrows   |

**Config Schema:**

| Field               | Type                                                   | Default             | Description                    |
| ------------------- | ------------------------------------------------------ | ------------------- | ------------------------------ |
| heading             | text                                                   | "Featured Products" | Section heading                |
| subheading          | text                                                   | ""                  | Optional subheading            |
| product_source      | select: featured, newest, bestselling, on_sale, manual | "featured"          | Which products                 |
| manual_product_ids  | product_picker                                         | []                  | Products if source is "manual" |
| max_items           | number (2-24)                                          | 8                   | Max products to display        |
| columns             | select: 2, 3, 4, 5                                     | 4                   | Grid columns (desktop)         |
| show_price          | toggle                                                 | true                | Show price                     |
| show_original_price | toggle                                                 | true                | Show strikethrough for sales   |
| show_add_to_cart    | toggle                                                 | true                | Quick add-to-cart button       |
| show_rating         | toggle                                                 | false               | Show product rating            |
| view_all_link       | toggle                                                 | true                | Show "View All" link           |
| view_all_text       | text                                                   | "View All Products" | Link text                      |

**Data Resolver:**

```php
public function resolveData(array $config, Shop $shop): array
{
    $query = Product::query()
        ->where('shop_id', $shop->id)
        ->where('is_active', true)
        ->with(['variants' => fn($q) => $q->where('is_active', true)->where('is_available_online', true), 'images']);

    return match ($config['product_source']) {
        'featured' => $query->where('is_featured', true)->limit($config['max_items'])->get(),
        'newest' => $query->latest()->limit($config['max_items'])->get(),
        'bestselling' => $this->getBestsellers($shop, $config['max_items']),
        'on_sale' => $this->getOnSaleProducts($shop, $config['max_items']),
        'manual' => Product::query()->whereIn('id', $config['manual_product_ids'] ?? [])->where('is_active', true)->with(['variants', 'images'])->get(),
    };
}
```

---

#### 3. Product Grid (`product_grid`)

**Category:** Products | **Max per page:** 2 | **Min tier:** None

Full product catalog with filtering, search, sorting, pagination.

**Layout Variants:**

| Variant            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `standard_grid`    | Grid with top bar (search, sort, filters toggle) |
| `sidebar_filters`  | Persistent sidebar with filter controls          |
| `infinite_scroll`  | No pagination, infinite scroll loading           |
| `grid_list_toggle` | User can switch between grid and list view       |

**Config Schema:**

| Field             | Type                                                         | Default        | Description            |
| ----------------- | ------------------------------------------------------------ | -------------- | ---------------------- |
| heading           | text                                                         | "Our Products" | Section heading        |
| show_search       | toggle                                                       | true           | Search bar             |
| show_filters      | toggle                                                       | true           | Category/price filters |
| show_sort         | toggle                                                       | true           | Sort dropdown          |
| default_sort      | select: newest, price_asc, price_desc, name_asc, bestselling | "newest"       | Default sort           |
| products_per_page | select: 12, 16, 20, 24, 32                                   | 16             | Pagination size        |
| columns           | select: 2, 3, 4, 5                                           | 4              | Grid columns (desktop) |

**Data Resolver:** Returns paginated products with category tree for filters. Uses AJAX for pagination/filtering.

---

#### 4. Category Grid (`category_grid`)

**Category:** Products | **Max per page:** 2 | **Min tier:** None

**Layout Variants:**

| Variant         | Description                            |
| --------------- | -------------------------------------- |
| `image_overlay` | Image with category name overlaid      |
| `image_above`   | Image above, text below                |
| `icon_grid`     | Icon/emoji + text, compact grid        |
| `carousel`      | Horizontally scrollable category cards |
| `chips`         | Compact pill-shaped category links     |

**Config Schema:**

| Field               | Type                                 | Default            | Description                 |
| ------------------- | ------------------------------------ | ------------------ | --------------------------- |
| heading             | text                                 | "Shop by Category" | Section heading             |
| layout              | select: grid_2x2, grid_3x2, grid_3x3 | "grid_3x2"         | Grid layout                 |
| show_product_count  | toggle                               | true               | Product count per category  |
| category_source     | select: auto, manual                 | "auto"             | Auto = top-level categories |
| manual_category_ids | category_picker                      | []                 | If manual                   |
| max_items           | number (2-12)                        | 6                  | Max categories              |

**Data Resolver:** Returns categories with product counts and images.

---

#### 5. Rich Text (`rich_text`)

**Category:** Content | **Max per page:** unlimited | **Min tier:** None

**Config Schema:**

| Field            | Type                               | Default       | Description         |
| ---------------- | ---------------------------------- | ------------- | ------------------- |
| content          | rich_text_editor                   | ""            | Tiptap content      |
| max_width        | select: narrow, medium, wide, full | "medium"      | Content width       |
| text_alignment   | select: left, center, right        | "left"        | Alignment           |
| padding          | select: none, small, medium, large | "medium"      | Vertical padding    |
| background_color | color_preset                       | "transparent" | Background override |

**Data Resolver:** None.

---

#### 6. Image With Text (`image_with_text`)

**Category:** Content | **Max per page:** unlimited | **Min tier:** None

**Layout Variants:**

| Variant        | Description                                        |
| -------------- | -------------------------------------------------- |
| `side_by_side` | Image and text side by side                        |
| `overlap`      | Image overlaps text container slightly (polished+) |
| `stacked`      | Image above text, full-width                       |
| `text_wrap`    | Text wraps around image                            |

**Config Schema:**

| Field            | Type                            | Default       | Description       |
| ---------------- | ------------------------------- | ------------- | ----------------- |
| heading          | text                            | ""            | Section heading   |
| content          | rich_text_editor                | ""            | Body content      |
| image            | image_upload                    | null          | Section image     |
| image_position   | select: left, right             | "left"        | Image placement   |
| image_width      | select: third, half, two_thirds | "half"        | Image width ratio |
| cta_text         | text                            | ""            | Optional button   |
| cta_link         | text                            | ""            | Button link       |
| background_color | color_preset                    | "transparent" | Background        |

**Data Resolver:** None.

---

#### 7. Testimonials (`testimonials`)

**Category:** Social Proof | **Max per page:** 2 | **Min tier:** None

**Layout Variants:**

| Variant            | Description                                   |
| ------------------ | --------------------------------------------- |
| `carousel`         | Rotating testimonial cards                    |
| `grid`             | Static grid of testimonial cards              |
| `masonry`          | Variable-height testimonial blocks            |
| `single_spotlight` | One large testimonial at a time, fade between |
| `marquee`          | Continuously scrolling horizontal ticker      |

**Config Schema:**

| Field           | Type             | Default                  | Description                      |
| --------------- | ---------------- | ------------------------ | -------------------------------- |
| heading         | text             | "What Our Customers Say" | Section heading                  |
| items           | testimonial_list | []                       | Array of testimonials            |
| auto_rotate     | toggle           | true                     | Auto-rotate (carousel/spotlight) |
| rotate_interval | number (3-10)    | 5                        | Seconds between slides           |
| show_rating     | toggle           | true                     | Show star ratings                |
| columns         | select: 2, 3     | 3                        | Columns for grid                 |

Testimonial item: `{ name, text, rating, avatar_path, location }`

**Data Resolver:** None (manual content).

---

#### 8. Announcement Bar (`announcement_bar`)

**Category:** Navigation | **Max per page:** 1 | **Min tier:** None

**Config Schema:**

| Field            | Type                      | Default      | Description                |
| ---------------- | ------------------------- | ------------ | -------------------------- |
| text             | text                      | ""           | Announcement text          |
| background_color | color_preset              | theme accent | Bar background             |
| text_color       | color_preset              | "#ffffff"    | Text color                 |
| link_url         | text                      | ""           | Optional link              |
| link_text        | text                      | ""           | Link text                  |
| is_dismissible   | toggle                    | true         | Can visitors close it      |
| style            | select: static, scrolling | "static"     | Ticker style for long text |

**Data Resolver:** None.

---

#### 9. Newsletter Signup (`newsletter_signup`)

**Category:** Commerce | **Max per page:** 1 | **Min tier:** None

**Layout Variants:**

| Variant         | Description                         |
| --------------- | ----------------------------------- |
| `inline`        | Input + button on one line          |
| `stacked`       | Input above button                  |
| `split`         | Text on one side, form on the other |
| `popup_trigger` | Minimal trigger that opens a modal  |

**Config Schema:**

| Field            | Type         | Default                            | Description       |
| ---------------- | ------------ | ---------------------------------- | ----------------- |
| heading          | text         | "Stay Updated"                     | Section heading   |
| subheading       | text         | "Subscribe for offers and updates" | Subtext           |
| placeholder      | text         | "Enter your email"                 | Input placeholder |
| button_text      | text         | "Subscribe"                        | Submit button     |
| background_color | color_preset | theme surface                      | Background        |
| success_message  | text         | "Thanks for subscribing!"          | Post-submit       |

**Data Resolver:** None.

---

#### 10. Banner (`banner`)

**Category:** Media | **Max per page:** unlimited | **Min tier:** None

**Config Schema:**

| Field        | Type                               | Default | Description           |
| ------------ | ---------------------------------- | ------- | --------------------- |
| image        | image_upload                       | null    | Banner image          |
| mobile_image | image_upload                       | null    | Mobile-specific image |
| alt_text     | text                               | ""      | Accessibility text    |
| link_url     | text                               | ""      | Click-through URL     |
| height       | select: small, medium, large, auto | "auto"  | Height                |

**Data Resolver:** None.

---

#### 11. Spacer (`spacer`)

**Category:** Layout | **Max per page:** unlimited | **Min tier:** None

**Config Schema:**

| Field         | Type                                 | Default       | Description                      |
| ------------- | ------------------------------------ | ------------- | -------------------------------- |
| height        | select: small, medium, large, xlarge | "medium"      | 16/32/64/96px                    |
| show_divider  | toggle                               | false         | Horizontal line                  |
| divider_style | select                               | theme default | Uses theme divider_style options |

**Data Resolver:** None.

---

#### 12. Gallery (`gallery`)

**Category:** Media | **Max per page:** 2 | **Min tier:** None

**Layout Variants:**

| Variant             | Description                       |
| ------------------- | --------------------------------- |
| `grid`              | Even grid                         |
| `masonry`           | Variable-height masonry           |
| `carousel`          | Swipeable carousel                |
| `fullscreen_slider` | Lightbox-style full-screen slider |

**Config Schema:**

| Field    | Type                        | Default | Description        |
| -------- | --------------------------- | ------- | ------------------ |
| heading  | text                        | ""      | Optional heading   |
| images   | image_list                  | []      | Array of images    |
| columns  | select: 2, 3, 4             | 3       | Grid columns       |
| lightbox | toggle                      | true    | Click to enlarge   |
| gap      | select: none, small, medium | "small" | Gap between images |

**Data Resolver:** None.

---

#### 13. Video (`video`)

**Category:** Media | **Max per page:** 2 | **Min tier:** None

**Layout Variants:**

| Variant           | Description                                     |
| ----------------- | ----------------------------------------------- |
| `embedded`        | Standard YouTube/Vimeo embed                    |
| `background_loop` | Looping video as section background (polished+) |
| `lightbox`        | Thumbnail that opens video in lightbox          |

**Config Schema:**

| Field           | Type                       | Default | Description                             |
| --------------- | -------------------------- | ------- | --------------------------------------- |
| heading         | text                       | ""      | Optional heading                        |
| video_url       | text                       | ""      | YouTube or Vimeo URL                    |
| thumbnail_image | image_upload               | null    | Custom thumbnail (for lightbox variant) |
| aspect_ratio    | select: 16:9, 4:3, 1:1     | "16:9"  | Aspect ratio                            |
| autoplay        | toggle                     | false   | Autoplay on scroll into view            |
| max_width       | select: medium, wide, full | "wide"  | Container width                         |

**Data Resolver:** None.

---

#### 14. FAQ (`faq`)

**Category:** Content | **Max per page:** 1 | **Min tier:** None

**Config Schema:**

| Field               | Type                                | Default                      | Description                 |
| ------------------- | ----------------------------------- | ---------------------------- | --------------------------- |
| heading             | text                                | "Frequently Asked Questions" | Heading                     |
| items               | faq_list                            | []                           | Array of {question, answer} |
| style               | select: accordion, list, two_column | "accordion"                  | Display style               |
| allow_multiple_open | toggle                              | false                        | Multiple expanded           |

**Data Resolver:** None.

---

#### 15. Contact Form (`contact_form`)

**Category:** Content | **Max per page:** 1 | **Min tier:** None

**Layout Variants:**

| Variant        | Description                               |
| -------------- | ----------------------------------------- |
| `side_by_side` | Contact info + form side by side          |
| `stacked`      | Contact info above, form below            |
| `form_only`    | Just the form, no contact details         |
| `card_grid`    | Contact methods as clickable cards + form |

**Config Schema:**

| Field           | Type                    | Default                               | Description                 |
| --------------- | ----------------------- | ------------------------------------- | --------------------------- |
| heading         | text                    | "Get In Touch"                        | Heading                     |
| subheading      | text                    | ""                                    | Subtext                     |
| show_phone      | toggle                  | true                                  | Show phone                  |
| show_email      | toggle                  | true                                  | Show email                  |
| show_address    | toggle                  | true                                  | Show address                |
| show_form       | toggle                  | true                                  | Show form                   |
| form_fields     | select: basic, detailed | "basic"                               | basic: name, email, message |
| success_message | text                    | "Thanks! We'll get back to you soon." | Post-submit                 |

**Data Resolver:** Returns shop contact details.

---

#### 16. Logo Cloud (`logo_cloud`)

**Category:** Social Proof | **Max per page:** 1 | **Min tier:** None

**Config Schema:**

| Field        | Type                              | Default      | Description        |
| ------------ | --------------------------------- | ------------ | ------------------ |
| heading      | text                              | "Trusted By" | Heading            |
| logos        | image_list                        | []           | Logo images        |
| display_mode | select: static, scrolling_marquee | "static"     | Animation          |
| grayscale    | toggle                            | true         | Grayscale logos    |
| max_height   | number                            | 48           | Max logo height px |

**Data Resolver:** None.

---

#### 17. Countdown (`countdown`)

**Category:** Commerce | **Max per page:** 1 | **Min tier:** None

**Config Schema:**

| Field            | Type                                 | Default                | Description      |
| ---------------- | ------------------------------------ | ---------------------- | ---------------- |
| heading          | text                                 | "Sale Ends In"         | Heading          |
| target_date      | datetime                             | null                   | Countdown target |
| expired_message  | text                                 | "This offer has ended" | Post-expiry text |
| background_color | color_preset                         | theme accent           | Background       |
| text_color       | color_preset                         | "#ffffff"              | Text color       |
| cta_text         | text                                 | "Shop Now"             | Button text      |
| cta_link         | text                                 | "/products"            | Button link      |
| style            | select: flip_clock, digital, minimal | "digital"              | Counter style    |

**Data Resolver:** None.

---

#### 18. Collection List (`collection_list`)

**Category:** Products | **Max per page:** 2 | **Min tier:** None

**Layout Variants:**

| Variant     | Description                                  |
| ----------- | -------------------------------------------- |
| `tabs`      | Tabbed interface, switch between collections |
| `rows`      | Stacked rows, one per collection             |
| `accordion` | Expandable collection sections               |

**Config Schema:**

| Field       | Type               | Default           | Description                                              |
| ----------- | ------------------ | ----------------- | -------------------------------------------------------- |
| heading     | text               | "Our Collections" | Heading                                                  |
| collections | collection_list    | []                | Array of {title, product_source, category_id, max_items} |
| columns     | select: 2, 3, 4, 5 | 4                 | Grid columns                                             |

**Data Resolver:** Returns products for each collection.

---

#### 19. Recently Viewed (`recently_viewed`)

**Category:** Products | **Max per page:** 1 | **Min tier:** None

**Config Schema:**

| Field     | Type               | Default           | Description  |
| --------- | ------------------ | ----------------- | ------------ |
| heading   | text               | "Recently Viewed" | Heading      |
| max_items | number (4-12)      | 6                 | Max products |
| columns   | select: 3, 4, 5, 6 | 4                 | Grid columns |

**Data Resolver:** None. Client-side reads from localStorage.

---

#### 20. Map (`map`)

**Category:** Content | **Max per page:** 1 | **Min tier:** None

**Config Schema:**

| Field                | Type                         | Default  | Description           |
| -------------------- | ---------------------------- | -------- | --------------------- |
| heading              | text                         | ""       | Optional heading      |
| embed_url            | text                         | ""       | Google Maps embed URL |
| height               | select: small, medium, large | "medium" | 250/400/550px         |
| show_address_overlay | toggle                       | true     | Address card on map   |

**Data Resolver:** Returns shop address.

---

## Template Catalog

### Template 1: Classic Commerce

**Category:** Commerce
**Animation Tier:** Subtle
**Navigation:** Standard top bar with dropdown categories
**Scroll:** Standard scroll
**Best for:** General retail, pharmacy, grocery, electronics — the broadest use case

The workhorse template. Traditional vertical section stack. Clear header-hero-content-footer flow. Every section has defined boundaries. Familiar e-commerce patterns that convert. Optimized for speed and clarity over visual drama.

**Structural config:**

- Container stack layout, max-width 1280px
- Header: standard, centered_logo, transparent_overlay
- Footer: multi_column, minimal, centered
- Hero: centered_overlay, split_image, slideshow, minimal_text
- Products: standard_grid, masonry
- No parallax, no scroll-pinning, no 3D
- Sidebar support for product_grid filter variant

**Themes (6):**

| Theme                  | Mood                                  | Colors                                          | Typography      | Card Style                             | Best For                          |
| ---------------------- | ------------------------------------- | ----------------------------------------------- | --------------- | -------------------------------------- | --------------------------------- |
| **Lagos Express**      | Bold, high-energy, conversion-focused | White bg, coral-red (#e94560) accent, dark text | DM Sans 700/400 | Elevated, prominent CTAs, 4-col grid   | General retail, electronics       |
| **Sunshine Market**    | Warm, friendly, deal-driven           | Cream (#fffbf0) bg, orange (#f97316) accent     | Poppins 600/400 | Rounded, deal badges, sale tags        | Grocery, supermarket              |
| **Abuja Fresh**        | Clean, trustworthy, clinical          | White bg, green (#16a34a) accent                | DM Sans 600/400 | Flat, trust badges, clean borders      | Pharmacy, health, organic         |
| **Crystal Clear**      | Modern minimal, restrained            | White bg, slate (#475569) + sky blue (#0ea5e9)  | Inter 500/400   | Bordered, lots of whitespace           | Modern retail, curated shops      |
| **Naija Vibrant**      | Energetic, youthful, bold             | White bg, teal (#0d9488) + coral (#f43f5e)      | Outfit 700/400  | Elevated with color accents            | Youth fashion, lifestyle          |
| **Metro Professional** | Corporate-adjacent, structured        | Light gray (#f8fafc) bg, navy (#1e3a5f) accent  | DM Sans 600/400 | Flat with subtle borders, grid-aligned | Professional services, B2B retail |

---

### Template 2: Editorial Showcase

**Category:** Editorial
**Animation Tier:** Polished
**Navigation:** Minimal overlay, hamburger menu, or centered logo
**Scroll:** Smooth scroll (Lenis), subtle parallax on images
**Best for:** Fashion, luxury, artisan brands, lifestyle

Magazine-style layouts. Large imagery dominates. Generous whitespace. Content-first with curated product integration. The products feel aspirational, not transactional. Staggered reveals on scroll. Elegant page transitions.

**Structural config:**

- Full-bleed sections, max-width 1440px for text
- Header: minimal, centered_logo, transparent_overlay
- Footer: minimal, centered, mega_footer
- Hero: centered_overlay, asymmetric, video_background, minimal_text
- Products: standard_grid, masonry, spotlight_plus_grid
- Parallax on images, smooth scroll via Lenis
- No sidebar, no mega menu

**Themes (6):**

| Theme                | Mood                             | Colors                                                    | Typography                        | Card Style                                 | Best For                                |
| -------------------- | -------------------------------- | --------------------------------------------------------- | --------------------------------- | ------------------------------------------ | --------------------------------------- |
| **Eko Luxe**         | Dark, editorial, opulent         | Black (#0a0a0a) bg, gold (#d4af37) accent, white text     | Playfair Display / DM Sans        | Borderless, dramatic shadows, 3-col        | High-end fashion, luxury                |
| **Terra Warm**       | Earthy, intimate, handcrafted    | Warm cream (#faf5f0) bg, saddle brown (#8B4513) accent    | Cormorant Garamond / Lato         | Large imagery, minimal borders             | Artisan, handmade, organic              |
| **Midnight Gallery** | Stark, dramatic, art-forward     | Pure black bg, white text, no accent color                | Libre Baskerville / Source Sans 3 | Full-bleed images, no cards, gallery-style | Art, photography, luxury jewelry        |
| **Blush Atelier**    | Soft, elegant, feminine          | Blush (#fdf2f4) bg, rose (#be185d) accent, warm gray text | Cormorant Garamond / Nunito       | Soft shadows, rounded, generous padding    | Feminine fashion, beauty, bridal        |
| **Monochrome**       | High contrast, typographic, bold | White bg, pure black (#000000) text/accent only           | Archivo Black / Archivo           | Sharp edges, strong borders, no shadows    | High fashion, streetwear, editorial     |
| **Velvet & Gold**    | Opulent, evening, dramatic       | Deep burgundy (#2d0a0a) bg, gold (#c9a84c) accent         | Playfair Display / Cormorant      | Gold borders, ornamental dividers          | Premium events, nightlife, luxury gifts |

---

### Template 3: Marketplace Hub

**Category:** Marketplace
**Animation Tier:** None (speed over style)
**Navigation:** Mega menu with category tree, prominent search bar
**Scroll:** Standard, fast loading, lazy load
**Best for:** Electronics, wholesale, multi-category, supermarkets

Dense, high-information layouts. Category sidebar, deal banners, flash sale countdowns, comparison tools, quick-view modals. Optimized for finding products fast across large inventories. Speed is the feature — every millisecond of animation is a millisecond not spent browsing.

**Structural config:**

- Sidebar + content layout, max-width 1440px
- Header: standard with mega_menu, prominent search
- Footer: multi_column, mega_footer
- Hero: slideshow (promotional carousel), minimal_text (deals)
- Products: standard_grid, grid_list_toggle, infinite_scroll, sidebar_filters
- No parallax, no smooth scroll, no 3D
- Sidebar support always on

**Themes (6):**

| Theme             | Mood                          | Colors                                                    | Typography             | Card Style                                        | Best For                                    |
| ----------------- | ----------------------------- | --------------------------------------------------------- | ---------------------- | ------------------------------------------------- | ------------------------------------------- |
| **Neon District** | Dark, futuristic, tech        | Deep navy (#0a0a1a) bg, electric purple (#a855f7) glow    | Space Grotesk / Inter  | Glowing borders, neon badges, dark cards          | Tech, gaming, electronics                   |
| **Deal Zone**     | Loud, urgent, deal-driven     | White bg, red (#dc2626) + orange (#f97316) accents        | DM Sans 700/400        | Bold price displays, sale ribbons, urgency badges | Flash sales, deal sites, general e-commerce |
| **Mega Store**    | Corporate, organized, trusted | White bg, blue (#2563eb) + orange (#f97316)               | Inter 600/400          | Clean cards, category breadcrumbs, comparison     | Large retail, multi-department              |
| **Tech Vault**    | Technical, precise, dark      | Dark gray (#18181b) bg, neon green (#22c55e) accent       | JetBrains Mono / Inter | Monospace price displays, spec tables, compact    | Computer parts, electronics, tools          |
| **Wholesale Pro** | Utilitarian, no-nonsense, B2B | Light gray (#f5f5f5) bg, blue (#1d4ed8) accent            | Inter 500/400          | Table rows, bulk pricing, minimal imagery         | Wholesale, B2B, bulk retail                 |
| **Bazaar**        | Warm, vibrant, market energy  | Cream bg, spice tones (turmeric #d97706, paprika #dc2626) | Outfit / DM Sans       | Warm shadows, pattern accents, deal stickers      | Traditional markets, multi-vendor, bazaars  |

---

### Template 4: Immersive Experience (Premium)

**Category:** Immersive
**Animation Tier:** Cinematic
**Navigation:** Transparent overlay, appears on scroll, minimal
**Scroll:** Parallax, GSAP ScrollTrigger, optional scroll-pinning, Lenis smooth scroll
**Best for:** Premium brands, product launches, luxury, high-end tech
**Premium:** Yes — this template is a paid upgrade

Full-screen sections. Every scroll position is choreographed. Parallax layers create depth. Sections pin and reveal content. Product presentations are theatrical — scroll to rotate, scroll to reveal features. Optional 3D product viewer. Video backgrounds. This is Apple.com energy for Nigerian premium brands.

**Structural config:**

- Full-viewport sections, no visible container boundaries
- Header: transparent_overlay only
- Footer: minimal, centered
- Hero: video_background, centered_overlay (full-screen), asymmetric
- Products: spotlight_plus_grid, masonry, carousel
- Full parallax, scroll-pinning, horizontal scroll sections, 3D viewer support
- GSAP ScrollTrigger for complex timelines
- No sidebar, no mega menu

**Themes (6):**

| Theme             | Mood                             | Colors                                                             | Typography                       | Card Style                                     | Best For                                 |
| ----------------- | -------------------------------- | ------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| **Kinetic Black** | Stark, dramatic, Apple-esque     | Pure black bg, white text, no color except product imagery         | Helvetica Neue / SF Pro (system) | No visible cards, products float on black      | Premium tech, single-product launches    |
| **Aurora**        | Ethereal, dreamy, gradient-rich  | Dark bg (#0f0f23), gradient mesh accents (purple→teal→pink)        | Sora / Inter                     | Glass cards with blur, gradient borders        | Luxury cosmetics, premium wellness       |
| **Glass**         | Futuristic, layered, translucent | Dark bg, glassmorphism panels, blur effects                        | Inter 300/400                    | Glass cards, frosted backgrounds, depth layers | Fintech, SaaS-adjacent premium           |
| **Neon Pulse**    | Cyberpunk, gaming, electric      | Near-black (#050510) bg, neon glow (cyan #06b6d4, magenta #ec4899) | Orbitron / Space Grotesk         | Neon-bordered, glow effects, scanline textures | Gaming peripherals, tech lifestyle       |
| **Organic Flow**  | Natural, fluid, calming          | Off-white (#fafaf8) bg, earth tones, organic blobs                 | Fraunces / Nunito                | Rounded, organic shapes, no sharp edges        | Premium wellness, organic luxury, spas   |
| **Cinematic**     | Film noir, dramatic, widescreen  | Dark bg (#0a0a0a), warm accent (#e8a87c), film grain overlay       | Bodoni Moda / Source Serif 4     | Widescreen imagery, dramatic shadows           | Luxury fashion film, premium experiences |

---

### Template 5: Catalog Pro

**Category:** Catalog
**Animation Tier:** None
**Navigation:** Category tabs + prominent search bar
**Scroll:** Standard, pagination or infinite scroll
**Best for:** Large inventories (100+ products), parts stores, wholesale, B2B, medical supply

Search-first, filter-heavy. Maximum product density with minimum decoration. The product IS the interface. Grid/list view toggle, quick-view modals, comparison mode, specification tables. Fast filtering, fast loading. For shops where customers know what they want and need to find it fast.

**Structural config:**

- Sidebar + content layout, max-width 1440px
- Header: standard with prominent search, category tabs
- Footer: minimal
- Hero: optional (usually replaced by search + featured categories)
- Products: standard_grid, grid_list_toggle, infinite_scroll, sidebar_filters
- No parallax, no animations, no 3D
- Sidebar always on, filter-heavy
- Quick-view modal support
- Comparison mode support

**Themes (6):**

| Theme              | Mood                          | Colors                                                  | Typography                        | Card Style                                       | Best For                            |
| ------------------ | ----------------------------- | ------------------------------------------------------- | --------------------------------- | ------------------------------------------------ | ----------------------------------- |
| **Clean Sheet**    | Minimal, data-forward         | White bg, slate (#64748b) borders, blue (#2563eb) links | Inter 400/400                     | Table-like, dense, lots of data visible          | Large general inventory             |
| **Industrial**     | Rugged, utilitarian, workshop | Dark gray (#1c1917) sidebar, orange (#ea580c) accent    | Roboto Condensed / Roboto         | Compact cards, specification-heavy               | Auto parts, tools, hardware         |
| **Medical Supply** | Clean, sterile, trustworthy   | White bg, green (#15803d) accent, blue highlights       | DM Sans 500/400                   | Clean borders, certification badges, dosage info | Pharmacy, medical equipment         |
| **Library**        | Warm, curated, catalog-feel   | Cream (#faf8f5) bg, brown (#78350f) accent              | Libre Baskerville / Source Sans 3 | Card-catalog style, warm borders                 | Books, curated collections, vintage |
| **Blueprint**      | Technical, precise, schematic | White bg, blueprint blue (#1e40af) accent               | IBM Plex Mono / IBM Plex Sans     | Technical drawing aesthetic, grid lines          | Engineering, electronics components |
| **Digital Shelf**  | Modern, colorful, friendly    | White bg, category-colored accents (dynamic)            | Outfit / DM Sans                  | Colorful category chips, clean cards             | Multi-category general retail       |

---

### Template 6: Storyteller

**Category:** Storyteller
**Animation Tier:** Polished (upgradeable to Cinematic for premium shops)
**Navigation:** Minimal — logo + cart only, sections act as navigation
**Scroll:** Scroll-triggered reveals, parallax on images, pinned sections (if cinematic)
**Best for:** DTC brands, single-product or small-catalog shops, artisan makers, food brands

Long-scroll narrative. The page IS the story. Each section reveals the next chapter — origin, process, product, testimonials, purchase. Designed for shops with fewer products but stronger brand narratives. Every scroll position has purpose. Products aren't listed — they're presented.

**Structural config:**

- Full-width sections, narrative flow
- Header: minimal (logo + cart only)
- Footer: minimal, centered
- Hero: centered_overlay (full-screen), video_background, asymmetric
- Products: spotlight_plus_grid, carousel (curated, not browsed)
- Parallax on images, staggered reveals
- Optional scroll-pinning (cinematic tier upgrade)
- No sidebar, no search, no filters

**Themes (6):**

| Theme                 | Mood                                | Colors                                                 | Typography                     | Card Style                                          | Best For                                 |
| --------------------- | ----------------------------------- | ------------------------------------------------------ | ------------------------------ | --------------------------------------------------- | ---------------------------------------- |
| **Origin Story**      | Earthy, handcrafted, authentic      | Warm cream (#f5f0e8) bg, forest green (#365314) accent | Bitter / Karla                 | Raw textures, hand-drawn feel, large imagery        | Artisan makers, craft producers          |
| **Product Spotlight** | Clean, focused, Apple-esque         | White bg, minimal black text, no strong accent         | SF Pro / Inter                 | Product floats on white, minimal chrome             | Single hero product, DTC launches        |
| **Farm to Table**     | Fresh, green, appetizing            | Light green-cream (#f5faf0) bg, green (#4d7c0f) accent | Merriweather / Open Sans       | Food photography dominant, freshness badges         | Food, beverage, farm direct              |
| **Maker's Journal**   | Raw, behind-the-scenes, documentary | Light warm gray (#f5f3ef) bg, charcoal (#292524) text  | Zilla Slab / Work Sans         | Scrapbook-style, process photos, raw edges          | Craft workshops, custom makers           |
| **Heritage**          | Vintage, established, legacy        | Aged cream (#f0ebe0) bg, sepia brown (#6b4226) accent  | Old Standard TT / Crimson Text | Vintage borders, serif-heavy, aged texture overlays | Established brands, heritage goods       |
| **Capsule**           | Ultra-minimal, fashion-forward      | White bg, black text only, one accent per collection   | Figtree / Inter                | No visible cards, products arranged editorially     | Small fashion collections, capsule drops |

---

### Template 7: Menu & Ordering

**Category:** Service
**Animation Tier:** Subtle
**Navigation:** Standard top bar with category tabs (starters, mains, drinks, etc.)
**Scroll:** Standard scroll with sticky category nav
**Best for:** Restaurants, bakeries, food vendors, juice bars, small chops, catering

Food-first layout. Menu organized by categories with food photography, dietary tags (halal, vegetarian, spicy), portion sizes, and add-to-order flow. Not a product grid — a menu. Category tabs stick to the top as you scroll. Cart shows order summary with delivery/pickup toggle.

**Structural config:**
- Container stack, max-width 1280px
- Header: standard with location/delivery toggle
- Footer: minimal with hours, location, contact
- Hero: centered_overlay (food hero image), minimal_text (hours + order CTA)
- Products displayed as menu items (not grid cards) — image, name, description, price, add button
- Sticky category tab bar below header
- No sidebar, no mega menu
- Order type toggle: pickup vs delivery

**Unique section types required:**
- `menu_category` — Category header with items listed below (not a grid, a vertical list with images)
- `order_type_selector` — Pickup/delivery/dine-in toggle with address input for delivery
- `hours_and_location` — Operating hours table + map

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Suya Spot** | Vibrant, smoky, street food | Dark charcoal (#1c1917) bg, flame orange (#ea580c) accent | Outfit 700/400 | Bold menu items, fire emoji badges, large food photos | Street food, suya joints, grills |
| **Fresh Kitchen** | Clean, healthy, modern | White bg, leaf green (#16a34a) accent | DM Sans 500/400 | Clean cards, dietary tags, calorie counts | Healthy food, salad bars, juice bars |
| **Mama's Table** | Warm, homestyle, comforting | Cream (#faf5ef) bg, warm brown (#92400e) accent | Merriweather / Open Sans | Large photos, story descriptions, family-style portions | Home cooking, local restaurants, family joints |
| **Pastry Box** | Sweet, pastel, delightful | Soft pink (#fdf2f8) bg, rose (#e11d48) accent | Poppins 600/400 | Rounded cards, pastel badges, whimsical | Bakeries, cake shops, dessert bars |
| **Quick Bites** | Fast, efficient, no-frills | White bg, red (#dc2626) + yellow (#eab308) | DM Sans 700/400 | Compact menu rows, prominent prices, fast-add buttons | Fast food, shawarma, quick service |
| **Fine Dine** | Elegant, understated, premium | Near-black (#0a0a0a) bg, gold (#c9a84c) accent, white text | Cormorant Garamond / Lato | Minimal imagery, typography-focused, prix fixe layout | Upscale restaurants, wine bars, lounges |

---

### Template 8: Booking & Appointments

**Category:** Service
**Animation Tier:** Subtle
**Navigation:** Standard top bar with services/staff tabs
**Scroll:** Standard scroll
**Best for:** Salons, barbershops, spas, clinics, consultants, fitness trainers, photographers

Service cards with duration, price, and "Book Now" CTA. Staff profiles with photo, bio, specialties, and availability. Calendar integration for time slot selection. Before/after galleries. Loyalty/membership section.

**Structural config:**
- Container stack, max-width 1280px
- Header: standard, centered_logo
- Footer: multi_column with hours, location, booking CTA
- Hero: centered_overlay, split_image (staff photo + booking CTA)
- Services displayed as cards with duration + price (not product grid)
- Staff profile section with booking per staff member
- No sidebar, no mega menu

**Unique section types required:**
- `service_list` — Service cards with name, description, duration, price, "Book" CTA
- `staff_profiles` — Staff cards with photo, name, role, specialties, availability indicator
- `booking_calendar` — Embedded calendar with time slot picker (integrates with booking service)
- `before_after_gallery` — Slider/toggle comparing before and after images
- `membership_plans` — Tier comparison cards (Basic, Premium, VIP)

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Glow Studio** | Bright, clean, beauty | White bg, hot pink (#ec4899) accent | Poppins 600/400 | Rounded service cards, staff photo circles, gradient CTA buttons | Beauty salons, nail studios, lash bars |
| **Sharp Edge** | Bold, masculine, precise | Dark gray (#18181b) bg, electric blue (#3b82f6) accent | Space Grotesk / Inter | Sharp edges, minimal cards, bold typography | Barbershops, men's grooming |
| **Zen Retreat** | Calm, natural, restorative | Soft sage (#f5f7f2) bg, forest green (#365314) accent | Cormorant Garamond / Nunito | Soft shadows, organic shapes, generous whitespace | Spas, wellness centers, massage |
| **Pro Clinic** | Medical, trustworthy, sterile | White bg, blue (#2563eb) accent, green highlights | DM Sans 500/400 | Clean borders, credential badges, professional layout | Clinics, dental, physiotherapy |
| **Fit Zone** | Energetic, bold, motivating | Near-black (#0f0f0f) bg, neon lime (#84cc16) accent | Outfit 800/400 | High-contrast cards, progress indicators, bold CTAs | Gyms, personal trainers, fitness studios |
| **Creative Suite** | Artistic, portfolio-adjacent | Light warm gray (#fafaf9) bg, indigo (#6366f1) accent | Inter 400/400 | Image-heavy service cards, portfolio grid, clean | Photographers, designers, freelancers |

---

### Template 9: One-Page Micro Shop

**Category:** Specialty
**Animation Tier:** Polished
**Navigation:** No navigation pages — anchor links scroll to sections on the single page
**Scroll:** Smooth scroll (Lenis), subtle parallax
**Best for:** Side hustlers, single-product sellers, market vendors going digital, Instagram sellers

Everything on one scroll. Hero → Products (1-10 max) → About → Testimonials → Buy. No separate pages. No product detail page — clicking a product opens a modal or expands inline. Designed to be set up in under 5 minutes. The lowest barrier to entry for first-time sellers.

**Structural config:**
- Single page, full-width sections, narrative flow
- Header: minimal (logo + WhatsApp/cart only), sticky
- Footer: minimal (contact + social links)
- Hero: centered_overlay, minimal_text, split_image
- Products: inline product cards (1-10), click to expand/modal — not a separate page
- No sidebar, no search, no filters, no pagination
- WhatsApp order button as primary CTA option (Nigerian market)
- Anchor-link navigation (hero, products, about, contact)

**Unique section types required:**
- `product_showcase_inline` — Product cards that expand inline with full details, gallery, and add-to-cart (no navigation to separate page)
- `whatsapp_order` — WhatsApp CTA button that pre-fills an order message
- `social_proof_compact` — Combined Instagram feed + testimonials in one section

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Market Fresh** | Approachable, bright, casual | White bg, vibrant green (#22c55e) accent | Outfit 600/400 | Simple product cards, WhatsApp green CTA | Market vendors, fresh produce sellers |
| **Insta Shop** | Trendy, social-first, visual | White bg, gradient accent (pink→orange) | Poppins 500/400 | Instagram-style image cards, story-like sections | Instagram sellers, small fashion |
| **Hustle** | Bold, direct, no-nonsense | Black (#111111) bg, yellow (#eab308) accent, white text | DM Sans 700/400 | High-contrast cards, bold prices, urgency | Side hustlers, deal sellers |
| **Craft Corner** | Handmade, warm, personal | Cream (#faf5f0) bg, terracotta (#c2410c) accent | Bitter / Karla | Hand-drawn borders, personal touch, story-first | Handmade crafts, artisan goods |
| **Pop-Up** | Playful, temporary, energetic | Bright white bg, electric violet (#7c3aed) accent | Space Grotesk / Inter | Bubble shapes, playful layout, countdown | Pop-up shops, limited drops |
| **Essentials** | Ultra-clean, minimal, fast | White bg, slate gray (#475569) only | Inter 400/400 | Barely-there design, just product + price + buy | Essentials sellers, utilitarian |

---

### Template 10: Launch & Preorder

**Category:** Campaign
**Animation Tier:** Polished
**Navigation:** Minimal — logo + countdown only
**Scroll:** Smooth scroll, scroll-triggered reveals, parallax
**Best for:** Product launches, preorder campaigns, limited drops, crowdfunding-style sells, seasonal campaigns (Black Friday, Ramadan, Christmas)

Time-bound, urgency-driven. Countdown timer dominates. Email capture for early access. Pricing tiers (early bird, standard, VIP). Progress/goal bar ("42 of 100 claimed"). Social proof ticker. Designed to convert within one session. Can be repurposed for seasonal campaigns by swapping theme.

**Structural config:**
- Single page or minimal multi-page, narrative flow
- Header: minimal (logo + countdown)
- Footer: minimal
- Hero: centered_overlay (full-screen), video_background
- Countdown section pinned or prominent
- Pricing tier comparison
- Progress bar / "X of Y claimed" social proof
- Email capture for waitlist/early access
- Parallax on images, staggered reveals

**Unique section types required:**
- `pricing_tiers` — Side-by-side tier cards (Early Bird ₦X, Standard ₦Y, VIP ₦Z) with feature comparison
- `progress_goal` — Progress bar with "42 of 100 claimed" or "₦2.3M of ₦5M goal"
- `social_proof_ticker` — Live-updating ticker: "Adebayo from Lagos just ordered 2 minutes ago"
- `email_capture` — Waitlist/early access signup with incentive copy
- `launch_countdown` — Enhanced countdown with milestone reveals (different content at 7 days, 1 day, 1 hour)

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Hype Drop** | Urgent, exclusive, streetwear | Black bg, neon green (#22c55e) + white | Space Grotesk 700/400 | Bold countdown, ticker, limited-edition badges | Limited drops, streetwear, sneakers |
| **Early Bird** | Friendly, deal-focused, warm | Cream bg, coral (#f43f5e) accent | Outfit 600/400 | Tier cards, early-bird badges, progress bar | Preorder campaigns, early-bird pricing |
| **Black Friday** | Red-hot, urgent, deal-driven | Near-black bg, red (#dc2626) + yellow (#eab308) | DM Sans 800/400 | Flash deal cards, countdown prominently, price slashes | Black Friday, seasonal mega-sales |
| **Ramadan Special** | Warm, elegant, respectful | Deep green (#064e3b) bg, gold (#d4af37) accent, white text | Playfair Display / DM Sans | Elegant tier cards, crescent motifs, generous spacing | Ramadan campaigns, Eid sales |
| **Christmas Market** | Festive, warm, joyful | Deep red (#7f1d1d) bg, gold (#fbbf24) accent, cream text | Merriweather / Poppins | Gift-themed cards, ribbon decorations, snow texture | Christmas, holiday campaigns, gift boxes |
| **Product Reveal** | Clean, Apple-style, focused | White bg, minimal black text, product imagery drives color | SF Pro / Inter | Clean countdown, single-product focus, cinematic | Tech launches, premium product reveals |

---

### Template 11: Social Commerce

**Category:** Social
**Animation Tier:** Polished
**Navigation:** Standard with prominent search + "Shop the Look" tab
**Scroll:** Smooth scroll, staggered reveals
**Best for:** Fashion brands with strong Instagram presence, beauty brands, lifestyle sellers, influencer shops

Social-first e-commerce. User-generated content grid (customer photos wearing/using products). Shoppable posts — tap an image, see tagged products, add to cart. Influencer/ambassador spotlight sections. Review-heavy product pages with photo reviews. Instagram feed integration.

**Structural config:**
- Container stack, max-width 1440px
- Header: standard with "Shop the Look" navigation tab
- Footer: multi_column with social feed
- Hero: centered_overlay, slideshow (customer content), asymmetric
- Products: standard_grid, masonry (user-generated content style)
- Shoppable image grid (tap to reveal tagged products)
- Customer photo reviews on product pages
- Parallax on lifestyle imagery

**Unique section types required:**
- `shoppable_gallery` — Grid of lifestyle images with product hotspots (tap image → see tagged products → add to cart)
- `ugc_grid` — User-generated content grid (customer submitted photos with their purchase)
- `influencer_spotlight` — Ambassador/influencer profile card with their curated product picks
- `photo_reviews` — Review section with customer-uploaded photos alongside text reviews
- `instagram_feed` — Live Instagram feed embed or curated Instagram-style grid

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Feed** | Instagram-native, grid-first, visual | White bg, gradient pink→purple accent | Poppins 500/400 | Square image cards, minimal chrome, double-tap heart | Instagram-first brands, fashion |
| **Curator** | Editorial social, magazine-meets-gram | Light gray (#fafafa) bg, black accent | Archivo / Source Sans 3 | Magazine-style layout, editorial captions | Fashion editorial, curated lifestyle |
| **Glow Up** | Beauty, luminous, aspirational | Soft pink (#fef2f8) bg, hot pink (#ec4899) accent | DM Sans 500/400 | Before/after cards, review highlights, star ratings | Beauty, skincare, cosmetics |
| **Street Style** | Urban, bold, youth | White bg, neon yellow (#facc15) + black | Outfit 700/400 | Polaroid-style cards, bold text overlays | Streetwear, sneaker culture, youth fashion |
| **Community** | Warm, inclusive, user-focused | Warm cream (#faf7f2) bg, warm coral (#f97316) accent | Nunito 600/400 | Rounded cards, user avatars prominent, testimonial-heavy | Community-driven brands, handmade |
| **Luxe Social** | Premium social, curated | Black (#0a0a0a) bg, gold (#d4af37) accent | Playfair Display / DM Sans | Dark cards, gold borders, exclusive feel | Luxury with social presence |

---

### Template 12: Blog + Shop

**Category:** Content
**Animation Tier:** Subtle
**Navigation:** Standard with Blog + Shop navigation split
**Scroll:** Standard scroll
**Best for:** Beauty brands that blog, wellness/fitness with content, fashion bloggers selling merch, recipe sites selling ingredients

Content-commerce hybrid. Blog posts alongside product collections. Articles can link to featured products ("As seen in this post"). Author profiles. Category-based content organization. The blog drives traffic and trust, the shop converts.

**Structural config:**
- Container stack, max-width 1280px
- Header: standard with Blog/Shop split navigation
- Footer: multi_column with recent posts + newsletter
- Hero: centered_overlay, split_image (latest post + featured product)
- Blog listing with featured/latest posts
- Products integrated into blog posts (inline product cards)
- Author profile cards
- No sidebar on mobile, optional sidebar on desktop for blog categories

**Unique section types required:**
- `blog_feed` — Latest/featured blog posts as cards (title, excerpt, image, date, author)
- `blog_post_products` — Inline product recommendations within blog content ("Products mentioned in this post")
- `author_profile` — Author card with photo, bio, post count, social links
- `content_categories` — Blog category navigation (grid or list)

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Lifestyle Journal** | Editorial, content-first | White bg, muted sage (#6b7280) accent | Libre Baskerville / Source Sans 3 | Magazine-style post cards, generous typography | Lifestyle blogs, wellness |
| **Beauty Diary** | Soft, feminine, tutorial-focused | Blush (#fdf2f4) bg, rose (#be185d) accent | Poppins / Nunito | Rounded cards, step-by-step tutorial layouts | Beauty blogs, skincare routines |
| **Fit Life** | Energetic, motivating, health | White bg, lime green (#65a30d) accent | Outfit 600/400 | Bold headers, workout-style cards, progress indicators | Fitness blogs, health products |
| **Recipe Box** | Warm, appetizing, culinary | Cream (#fffbf0) bg, tomato red (#dc2626) accent | Merriweather / Open Sans | Recipe cards with cook time badges, ingredient lists | Food blogs, ingredient shops |
| **Tech Review** | Clean, informative, analytical | Light gray (#f9fafb) bg, blue (#2563eb) accent | Inter 500/400 | Spec comparison cards, rating scores, pros/cons | Tech review sites, gadget shops |
| **Creator Hub** | Modern, creator-economy | White bg, violet (#7c3aed) accent | DM Sans 500/400 | Content cards with view counts, merch integration | Content creators selling merch |

---

### Template 13: Wholesale & B2B Portal

**Category:** Social
**Animation Tier:** None
**Navigation:** Standard with account-based navigation (catalog, orders, quotes, account)
**Scroll:** Standard, fast
**Best for:** Distributors, manufacturers, bulk sellers, trade-only businesses

Account-gated storefront. Tiered pricing visible after login. Bulk order forms (quantity tables, not single add-to-cart). Quote request flow for large orders. Order history and reorder. Minimum order quantities and badges. Invoice/statement download. Not consumer-facing — this is business-to-business.

**Structural config:**
- Sidebar + content layout (when logged in), max-width 1440px
- Header: standard with account menu, prominent search
- Footer: minimal with company info, terms
- Hero: minimal_text (company intro + "Request Account" CTA)
- Products: grid_list_toggle with bulk pricing columns
- Account dashboard: order history, saved lists, statements
- No parallax, no animations, no 3D — speed and data clarity
- Login-gated sections (pricing visible only to approved accounts)

**Unique section types required:**
- `bulk_order_form` — Table-style form: product rows with quantity inputs, running total, MOQ indicators
- `pricing_tiers_table` — Tiered pricing table (1-9 units: ₦X, 10-49: ₦Y, 50+: ₦Z)
- `quote_request` — Form for requesting quotes on large/custom orders
- `account_dashboard` — Order history, saved product lists, statement downloads
- `trade_registration` — Account request form for new B2B customers (company name, tax ID, industry)

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Trade Direct** | Corporate, efficient, trustworthy | White bg, navy (#1e3a5f) accent | Inter 500/400 | Clean tables, corporate cards, professional | General B2B, distributors |
| **Warehouse** | Industrial, utilitarian, dense | Light gray (#f5f5f4) bg, orange (#ea580c) accent | Roboto Condensed / Roboto | Compact rows, specification-heavy, no imagery | Warehouse, industrial supply |
| **Agro Supply** | Agricultural, earthy, practical | Cream bg, green (#15803d) accent | DM Sans 500/400 | Product cards with pack sizes, seasonal badges | Agricultural supply, farm inputs |
| **Pharma Trade** | Medical, regulated, sterile | White bg, blue (#2563eb) + green (#16a34a) | DM Sans 400/400 | Regulatory badges, batch numbers, expiry indicators | Pharmaceutical wholesale |
| **Tech Distributor** | Modern, spec-driven, dark | Dark gray (#18181b) bg, cyan (#06b6d4) accent | Space Grotesk / Inter | Spec tables, compatibility badges, bulk pricing | Electronics, IT equipment wholesale |
| **Fashion Wholesale** | Visual, catalog-style, seasonal | White bg, warm accent (seasonal rotation) | Poppins 500/400 | Lookbook-style with MOQ badges, collection grouping | Fashion wholesale, textiles |

---

### Template 14: Portfolio & Services

**Category:** Service
**Animation Tier:** Polished
**Navigation:** Standard or centered logo with services/portfolio/about/contact
**Scroll:** Smooth scroll, staggered reveals, subtle parallax
**Best for:** Photographers, interior designers, event planners, freelancers, agencies, architects

Portfolio-first with service packages. Project gallery with case studies. Service cards with tiered pricing (Basic, Standard, Premium). Client testimonials with project photos. Inquiry/consultation booking form. Less about selling products, more about selling expertise.

**Structural config:**
- Full-bleed images + container text, max-width 1280px
- Header: centered_logo, standard
- Footer: minimal with contact CTA
- Hero: centered_overlay (portfolio hero), split_image (photo + intro), asymmetric
- Portfolio grid (masonry or grid with lightbox)
- Service packages as comparison cards
- No product grid, no cart (inquiry-based or fixed service packages)
- Parallax on portfolio images, staggered reveals

**Unique section types required:**
- `portfolio_grid` — Project gallery with filterable categories, lightbox, and optional case study overlay
- `service_packages` — Tiered service comparison (Basic/Standard/Premium) with feature lists and CTA per tier
- `client_logos_and_testimonials` — Combined logo cloud + testimonials (social proof for service businesses)
- `consultation_form` — Inquiry form with service selection, budget range, project description
- `process_timeline` — Step-by-step visual timeline of how you work (1. Consult → 2. Design → 3. Deliver)

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Studio** | Clean, modern, portfolio-focused | White bg, charcoal (#1c1917) + gold (#c9a84c) accent | Inter 400/400 | Full-bleed images, minimal text, gallery-first | Photographers, videographers |
| **Blueprint Pro** | Professional, structured, corporate | Light gray (#f8fafc) bg, navy (#1e3a5f) accent | DM Sans 600/400 | Service tier cards, structured layout, professional | Agencies, consulting firms |
| **Atelier** | Artistic, elegant, creative | Off-white (#faf9f7) bg, deep purple (#581c87) accent | Cormorant Garamond / Nunito | Asymmetric gallery, large imagery, artistic | Interior designers, artists, architects |
| **Maker Pro** | Craft-focused, warm, skilled | Warm cream (#f5f0e8) bg, amber (#d97706) accent | Bitter / Work Sans | Process-focused, behind-the-scenes, handcrafted | Custom furniture, bespoke crafts |
| **Digital Agency** | Modern, tech-savvy, dynamic | Dark (#111827) bg, gradient accent (blue→purple) | Space Grotesk / Inter | Animated cards, gradient borders, case study cards | Digital agencies, tech freelancers |
| **Event Planner** | Elegant, celebratory, visual | Blush (#fef2f8) bg, gold (#b8860b) accent | Playfair Display / Lato | Gallery-heavy, mood boards, event type categories | Event planners, wedding vendors |

---

### Template 15: Subscription Box

**Category:** Specialty
**Animation Tier:** Polished
**Navigation:** Standard with Subscribe/How It Works/Reviews tabs
**Scroll:** Smooth scroll, staggered reveals
**Best for:** Monthly boxes, recurring deliveries, membership-based products, curated selections

Subscription-first layout. Plan comparison as the primary conversion point. "What's in the box" reveal section. Delivery schedule visualization. Subscriber testimonials. Gifting option. Past box gallery showing previous months.

**Structural config:**
- Container stack, max-width 1280px
- Header: standard, centered_logo
- Footer: multi_column with subscription CTA
- Hero: centered_overlay, split_image (box unboxing imagery)
- Plan comparison as primary section
- "How it works" step-by-step section
- Past boxes gallery
- Parallax on lifestyle imagery, staggered reveals

**Unique section types required:**
- `subscription_plans` — Plan comparison cards with billing cycle, included items, price per delivery, "Subscribe" CTA
- `whats_in_the_box` — Reveal section showing current/sample box contents with product details
- `how_it_works_steps` — 3-4 step visual process (Choose Plan → We Curate → Receive Monthly)
- `past_boxes_gallery` — Grid of previous month's boxes with contents list
- `gift_subscription` — Gift flow with recipient details, message, delivery date

**Themes (6):**

| Theme | Mood | Colors | Typography | Card Style | Best For |
|-------|------|--------|-----------|------------|----------|
| **Unbox Joy** | Playful, surprise, colorful | White bg, multicolor accents (rotating per section) | Poppins 600/400 | Colorful plan cards, surprise/unbox animations | General subscription boxes |
| **Curated** | Premium, selective, editorial | Cream (#faf7f2) bg, muted gold (#a3842c) accent | Cormorant Garamond / Lato | Elegant plan comparison, editorial product reveals | Premium curated boxes, luxury |
| **Fresh Box** | Healthy, clean, green | White bg, green (#22c55e) accent | DM Sans 500/400 | Clean cards, freshness badges, delivery schedule | Food boxes, health boxes, organic |
| **Beauty Box** | Feminine, delightful, luxe | Soft pink (#fef2f8) bg, rose gold (#b76e79) accent | Poppins / Nunito | Pink plan cards, product swatches, before/after | Beauty, skincare subscription |
| **Mystery Crate** | Dark, exciting, gaming | Dark (#111111) bg, neon cyan (#06b6d4) accent | Space Grotesk / Inter | Glowing reveal cards, mystery/surprise language | Gaming loot boxes, mystery boxes |
| **Essentials Refill** | Minimal, practical, recurring | White bg, slate (#64748b) accent | Inter 400/400 | No-frills plan cards, delivery calendar, reorder | Essentials, household refills |

---

### Template Roadmap Summary

| Priority | Template | Category | Stage | Reason |
|----------|----------|----------|-------|--------|
| P0 | Classic Commerce | Commerce | Stage 1 | 60%+ of shops, broadest use case |
| P0 | Editorial Showcase | Editorial | Stage 2 | Fashion/luxury is a major Nigerian market |
| P0 | Marketplace Hub | Marketplace | Stage 3 | Electronics/wholesale — high-volume shops |
| P1 | Catalog Pro | Catalog | Stage 4 | Large inventories, B2B-adjacent |
| P1 | Storyteller | Storyteller | Stage 5 | DTC brands, artisan makers |
| P1 | Immersive Experience | Immersive | Stage 6 | Premium upsell, brand differentiator |
| P2 | Menu & Ordering | Service | Stage 7 | Huge restaurant/food market in Nigeria |
| P2 | Booking & Appointments | Service | Stage 8 | Salons/barbershops are everywhere |
| P2 | One-Page Micro Shop | Specialty | Stage 9 | Lowest barrier to entry, Instagram sellers |
| P2 | Launch & Preorder | Campaign | Stage 10 | Any shop can use for product drops |
| P3 | Social Commerce | Social | Stage 11 | Growing Instagram-commerce market |
| P3 | Blog + Shop | Content | Stage 12 | Content-driven brands |
| P3 | Wholesale & B2B Portal | Social | Stage 13 | Already a ShelfWiser use case |
| P3 | Portfolio & Services | Service | Stage 14 | Service-based businesses |
| P3 | Subscription Box | Specialty | Stage 15 | Emerging market, recurring revenue |

**15 templates × 6 themes each = 90 base presets.** With guardrailed customization, section composition, and variant selection on top, the combinatorial space is effectively infinite. No two shops need look alike.

---

## Implementation Sequence: One Template at a Time

### Stage 0: Foundation (Shared Infrastructure)

Build once, used by all templates:

1. Database migrations: `storefront_templates`, `storefront_themes`, `storefront_configs`, `storefront_pages`, `storefront_media`
2. Eloquent models with relationships and traits
3. Enums: `StorefrontTemplateCategory`, `StorefrontAnimationTier`, `StorefrontThemeCategory`, `StorefrontPageType`, `SectionCategory`
4. `StorefrontSectionInterface` contract (with variants)
5. `SectionTypeRegistry` service (template-aware)
6. `StorefrontServiceProvider`
7. All 20 section type PHP classes (config schema + data resolver)
8. `StorefrontRenderService` + `StorefrontRenderController` + Blade view
9. `StorefrontApiController` — JSON API for cart, checkout, auth, account mutations (reuses existing services)
10. React storefront entry point + `StorefrontRenderer` + `ThemeProvider` + `AnimationProvider`
11. Shared React components: `ProductCard`, `CartDrawer`, `SearchBar`, responsive grid system
12. Fixed themed pages: Cart, Checkout, Auth (Login, Register, Forgot/Reset Password), Account (Dashboard, Orders, Profile), Services — all fully themed via ThemeProvider
13. Builder UI: `PageBuilder`, `SectionPalette`, `SectionCanvas`, `SectionConfigPanel`, `ThemeConfigPanel`, `PreviewFrame`, all config field components
14. `StorefrontBuilderController` + `StorefrontBuilderService`
15. Caching layer
16. Media upload/management
17. Publish/unpublish flow
18. Vite second entry point
19. Full route migration: all storefront routes go through new pipeline, old Inertia storefront pages deprecated

### Stage 1: Classic Commerce (First Template)

The broadest use case. Covers 60%+ of ShelfWiser shops.

1. Seed Classic Commerce template with structural config
2. Implement all 6 themes as theme config objects
3. Build React section components with all Classic Commerce variants:
    - Hero: centered_overlay, split_image, slideshow, minimal_text, video_background
    - Featured Products: standard_grid, spotlight_plus_grid, horizontal_scroll, masonry, carousel
    - Product Grid: standard_grid, sidebar_filters, grid_list_toggle, infinite_scroll
    - Category Grid: image_overlay, image_above, chips, icon_grid, carousel
    - All content/layout sections
4. Build header variants: standard, centered_logo
5. Build footer variants: multi_column, minimal, centered
6. Subtle animation tier: IntersectionObserver + CSS animations for entrance effects
7. Full mobile responsiveness
8. E2E testing — complete flow: browse → add to cart → checkout → order confirmation
9. Production deploy

### Stage 2: Editorial Showcase

Fashion, luxury, artisan brands.

1. Seed Editorial Showcase template
2. 6 themes
3. Additional section variants: asymmetric hero, masonry products, marquee testimonials
4. Header variants: minimal, transparent_overlay
5. Polished animation tier: Framer Motion, Lenis smooth scroll, parallax images
6. Staggered reveal system
7. Page transitions (fade, slide)

### Stage 3: Marketplace Hub

Electronics, wholesale, high-volume.

1. Seed Marketplace Hub template
2. 6 themes
3. Additional section variants: infinite_scroll, sidebar_filters (always-on)
4. Mega menu navigation
5. Quick-view modal
6. Deal/flash sale UI components
7. No animation tier — speed optimized

### Stage 4: Catalog Pro

Large inventories, parts stores, B2B.

1. Seed Catalog Pro template
2. 6 themes
3. Grid/list view toggle
4. Comparison mode
5. Specification tables
6. Advanced filtering (multi-select, range, search within filters)

### Stage 5: Storyteller

DTC brands, small catalogs, narrative-driven.

1. Seed Storyteller template
2. 6 themes
3. Narrative section flow
4. Scroll-triggered reveals (Polished tier)
5. Pinned sections (optional Cinematic upgrade)

### Stage 6: Immersive Experience (Premium)

Premium brands, product launches, luxury.

1. Seed Immersive Experience template
2. 6 themes
3. Cinematic animation tier: GSAP ScrollTrigger, scroll-pinning, horizontal scroll
4. 3D Product Viewer: React Three Fiber, GLB upload, environment lighting
5. Video background sections
6. Parallax multi-layer system
7. Premium billing integration

### Stage 7: Menu & Ordering

Restaurants, bakeries, food vendors.

1. Seed Menu & Ordering template
2. 6 themes
3. New section types: `menu_category`, `order_type_selector`, `hours_and_location`
4. Sticky category tab navigation
5. Pickup/delivery toggle with address input
6. Menu-style product display (not grid cards)

### Stage 8: Booking & Appointments

Salons, barbershops, spas, clinics.

1. Seed Booking & Appointments template
2. 6 themes
3. New section types: `service_list`, `staff_profiles`, `booking_calendar`, `before_after_gallery`, `membership_plans`
4. Calendar integration for time slot selection
5. Staff-based booking flow

### Stage 9: One-Page Micro Shop

Instagram sellers, side hustlers, market vendors.

1. Seed One-Page Micro Shop template
2. 6 themes
3. New section types: `product_showcase_inline`, `whatsapp_order`, `social_proof_compact`
4. Anchor-link navigation (no pages)
5. Inline product expansion (no product detail page)
6. WhatsApp order CTA integration

### Stage 10: Launch & Preorder

Product drops, seasonal campaigns, preorders.

1. Seed Launch & Preorder template
2. 6 themes
3. New section types: `pricing_tiers`, `progress_goal`, `social_proof_ticker`, `email_capture`, `launch_countdown`
4. Urgency/scarcity UI patterns
5. Campaign-specific seasonal themes (Black Friday, Ramadan, Christmas)

### Stage 11: Social Commerce

Instagram-first brands, beauty, fashion with social presence.

1. Seed Social Commerce template
2. 6 themes
3. New section types: `shoppable_gallery`, `ugc_grid`, `influencer_spotlight`, `photo_reviews`, `instagram_feed`
4. Shoppable image hotspots (tap image → tagged products)
5. User-generated content management in builder

### Stage 12: Blog + Shop

Content-driven brands, beauty bloggers, recipe sites.

1. Seed Blog + Shop template
2. 6 themes
3. New section types: `blog_feed`, `blog_post_products`, `author_profile`, `content_categories`
4. Blog post creation in builder (Tiptap rich text)
5. Inline product recommendations within posts

### Stage 13: Wholesale & B2B Portal

Distributors, manufacturers, bulk sellers.

1. Seed Wholesale & B2B Portal template
2. 6 themes
3. New section types: `bulk_order_form`, `pricing_tiers_table`, `quote_request`, `account_dashboard`, `trade_registration`
4. Account-gated pricing and content
5. Bulk order quantity tables
6. Quote/invoice request flow

### Stage 14: Portfolio & Services

Photographers, agencies, freelancers, event planners.

1. Seed Portfolio & Services template
2. 6 themes
3. New section types: `portfolio_grid`, `service_packages`, `client_logos_and_testimonials`, `consultation_form`, `process_timeline`
4. Portfolio case study overlays
5. Service tier comparison cards
6. Inquiry/consultation booking form

### Stage 15: Subscription Box

Monthly boxes, recurring deliveries, curated selections.

1. Seed Subscription Box template
2. 6 themes
3. New section types: `subscription_plans`, `whats_in_the_box`, `how_it_works_steps`, `past_boxes_gallery`, `gift_subscription`
4. Subscription billing integration
5. Gift subscription flow

---

## Storefront Rendering Pipeline

### Two Page Categories

The storefront has two fundamentally different page categories, both fully themed:

**1. Composable pages** — shop owner drags sections, reorders, configures via the builder.
- Home, Products listing, Product detail, About, Contact, Custom pages
- Rendered from `StorefrontPage.sections` JSON
- Each section is a React component driven by config + variant + theme

**2. Fixed themed pages** — layout is predetermined (a cart IS a cart), but every visual element respects the theme: colors, fonts, button styles, card styles, spacing, header/footer, animations.
- Cart, Checkout, Checkout Success/Pending
- Auth: Login, Register, Forgot Password, Reset Password, Verify Email
- Account: Dashboard, Orders, Order Detail, Profile
- Services: Listing, Detail

Fixed pages share the same `ThemeProvider`, CSS variables, header/footer, and animation context as composable pages. The customer experiences a single, cohesive storefront — they cannot tell which pages are section-composed and which are fixed. The difference is only visible to the shop owner in the builder.

### Route Structure

**Page rendering routes** — all go through `StorefrontRenderController`, all return Blade→React:

```
/{shop-slug}                           → home (composable)
/{shop-slug}/products                  → products (composable)
/{shop-slug}/products/{slug}           → productDetail (composable)
/{shop-slug}/services                  → services (fixed themed)
/{shop-slug}/services/{slug}           → serviceDetail (fixed themed)
/{shop-slug}/cart                      → cart (fixed themed)
/{shop-slug}/checkout                  → checkout (fixed themed, auth:customer)
/{shop-slug}/checkout/success/{order}  → checkoutSuccess (fixed themed, auth:customer)
/{shop-slug}/checkout/pending/{order}  → checkoutPending (fixed themed, auth:customer)
/{shop-slug}/login                     → login (fixed themed, guest)
/{shop-slug}/register                  → register (fixed themed, guest)
/{shop-slug}/forgot-password           → forgotPassword (fixed themed, guest)
/{shop-slug}/reset-password/{token}    → resetPassword (fixed themed, guest)
/{shop-slug}/verify-email              → verifyEmail (fixed themed, auth:customer)
/{shop-slug}/account                   → accountDashboard (fixed themed, auth:customer)
/{shop-slug}/account/orders            → accountOrders (fixed themed, auth:customer)
/{shop-slug}/account/orders/{order}    → accountOrderDetail (fixed themed, auth:customer)
/{shop-slug}/account/profile           → accountProfile (fixed themed, auth:customer)
/{shop-slug}/about                     → page (composable)
/{shop-slug}/contact                   → page (composable)
/{shop-slug}/p/{custom-slug}           → page (composable)
```

**JSON API routes** — used by React for form submissions and mutations (cart add/remove, checkout, login, etc.):

```
POST   /{shop-slug}/api/cart                    → add item
PATCH  /{shop-slug}/api/cart/{item}              → update quantity
DELETE /{shop-slug}/api/cart/{item}              → remove item
POST   /{shop-slug}/api/cart/service             → add service item
GET    /{shop-slug}/api/cart/summary             → cart summary (header badge)
POST   /{shop-slug}/api/checkout                 → process checkout
POST   /{shop-slug}/api/auth/login               → login
POST   /{shop-slug}/api/auth/register            → register
POST   /{shop-slug}/api/auth/logout              → logout
POST   /{shop-slug}/api/auth/forgot-password     → send reset link
POST   /{shop-slug}/api/auth/reset-password      → reset password
POST   /{shop-slug}/api/auth/verify-email/resend → resend verification
PATCH  /{shop-slug}/api/account/profile          → update profile
POST   /{shop-slug}/api/account/orders/{order}/cancel → cancel order
GET    /{shop-slug}/payment/callback             → Paystack redirect (unchanged)
POST   /{shop-slug}/payment/webhook              → Paystack webhook (unchanged, CSRF exempt)
```

The JSON API controller (`StorefrontApiController`) is a thin layer — it reuses the existing `CartService`, `CheckoutService`, and auth logic from the current controllers, but returns JSON instead of Inertia redirects. The existing business logic is untouched.

NOT Inertia routes. Blade views bootstrap standalone React app.

### StorefrontRenderService

```php
class StorefrontRenderService
{
    public function __construct(
        private SectionTypeRegistry $sectionRegistry,
    ) {}

    public function buildPage(Shop $shop, StorefrontPageType $pageType, ?string $slug = null): array;
    public function resolveSections(StorefrontPage $page, Shop $shop): array;
    public function resolveThemeConfig(StorefrontConfig $config): array;
    public function buildThemeStyles(array $resolvedTheme): string;
    public function buildSeoMeta(StorefrontPage $page, StorefrontConfig $config, Shop $shop): array;
}
```

`resolveThemeConfig()` merges theme defaults with shop overrides:

```php
public function resolveThemeConfig(StorefrontConfig $config): array
{
    $theme = $config->theme;
    $themeConfig = $theme->theme_config;

    $colorPreset = $config->color_preset ?? $themeConfig['palette']['presets'][0]['name'];
    $colors = $colorPreset === 'custom'
        ? $config->color_overrides
        : collect($themeConfig['palette']['presets'])->firstWhere('name', $colorPreset);

    $typographyPreset = $config->typography_preset ?? $themeConfig['typography']['options'][0]['name'];
    $typography = collect($themeConfig['typography']['options'])->firstWhere('name', $typographyPreset);

    return [
        'template' => [
            'slug' => $theme->template->slug,
            'animation_tier' => $theme->template->animation_tier->value,
            'structural_config' => $theme->template->structural_config,
        ],
        'colors' => $colors,
        'typography' => array_merge($typography, $config->typography_overrides ?? []),
        'components' => array_merge($themeConfig['components'], $config->component_overrides ?? []),
        'feel' => array_merge($themeConfig['feel'], $config->feel_overrides ?? []),
        'animation' => array_merge($themeConfig['animation'], $config->animation_overrides ?? []),
        'header' => array_merge($themeConfig['header'], $config->header_overrides ?? []),
        'footer' => array_merge($themeConfig['footer'], $config->footer_overrides ?? []),
        'hero' => $themeConfig['hero'],
        'product_card' => $themeConfig['product_card'],
        'decorations' => $themeConfig['decorations'],
    ];
}
```

`buildPage()` returns:

```php
[
    'shop' => [...],
    'theme' => [...],             // Resolved merged config
    'themeStyles' => '...',       // CSS variables string
    'page' => [
        'type' => 'home',
        'title' => 'Welcome',
        'sections' => [
            [
                'id' => 'sec_abc123',
                'type' => 'hero_banner',
                'variant' => 'split_image',
                'scroll_animation' => 'fade_up',
                'config' => [...],
                'data' => [],
            ],
        ],
    ],
    'seo' => [...],
    'cart' => [...],
    'navigation' => [...],
]
```

### Blade View

`resources/views/storefront/app.blade.php`:

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $seo['title'] }}</title>
    <meta name="description" content="{{ $seo['description'] }}">
    <meta property="og:title" content="{{ $seo['og_title'] }}">
    <meta property="og:description" content="{{ $seo['og_description'] }}">
    @if($seo['og_image'])<meta property="og:image" content="{{ $seo['og_image'] }}">@endif
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <style>:root { {!! $themeStyles !!} }</style>
    @viteReactRefresh
    @vite(['resources/js/storefront/app.tsx'])
</head>
<body>
    <div id="storefront-root" data-page="{{ json_encode($pageData) }}"></div>
</body>
</html>
```

### React Storefront Architecture

```tsx
// resources/js/storefront/app.tsx
import { StorefrontRenderer } from './StorefrontRenderer';

const rootEl = document.getElementById('storefront-root');
const pageData = JSON.parse(rootEl?.dataset.page || '{}');

createRoot(rootEl!).render(<StorefrontRenderer {...pageData} />);
```

```tsx
// resources/js/storefront/StorefrontRenderer.tsx
import { ThemeProvider } from './ThemeProvider';
import { AnimationProvider } from './AnimationProvider';
import { templateLayoutRegistry } from './layouts/registry';
import { sectionRegistry } from './sections/registry';

function StorefrontRenderer({ shop, theme, page, cart, navigation }) {
    const Layout = templateLayoutRegistry[theme.template.slug];

    return (
        <ThemeProvider theme={theme}>
            <AnimationProvider tier={theme.template.animation_tier}>
                <Layout
                    shop={shop}
                    navigation={navigation}
                    cart={cart}
                    theme={theme}
                >
                    {page.sections
                        .filter((s) => s.is_visible)
                        .map((section) => {
                            const Component = sectionRegistry[section.type];
                            if (!Component) return null;
                            return (
                                <ScrollAnimation
                                    key={section.id}
                                    animation={section.scroll_animation}
                                    tier={theme.template.animation_tier}
                                >
                                    <Component
                                        config={section.config}
                                        variant={section.variant}
                                        data={section.data}
                                        theme={theme}
                                    />
                                </ScrollAnimation>
                            );
                        })}
                </Layout>
            </AnimationProvider>
        </ThemeProvider>
    );
}
```

**Key changes from previous spec:**

- `templateLayoutRegistry` — each template has its own layout component (different header/footer anatomy, navigation patterns, overall structure)
- `AnimationProvider` — manages animation tier, loads libraries conditionally (no GSAP for "subtle" tier)
- `ScrollAnimation` wrapper — applies per-section entrance animations based on tier
- `variant` prop passed to each section component — drives layout variant selection

### Template Layout Registry

```tsx
// resources/js/storefront/layouts/registry.ts
export const templateLayoutRegistry: Record<string, React.FC<LayoutProps>> = {
    'classic-commerce': ClassicCommerceLayout,
    'editorial-showcase': EditorialShowcaseLayout,
    'marketplace-hub': MarketplaceHubLayout,
    'immersive-experience': ImmersiveExperienceLayout,
    'catalog-pro': CatalogProLayout,
    storyteller: StorytellerLayout,
};
```

Each layout component defines that template's structural skeleton: header, footer, navigation, sidebar (if any), section flow.

---

## Builder UI (Admin Side, Inertia)

The builder lives at `/admin/storefront/builder`.

### Builder Flow

1. **Template Selection** — Shop owner picks a template (structural layout). Shows template previews with descriptions and ideal-for tags. One-time choice (changing template resets theme + sections).
2. **Theme Selection** — Within the chosen template, pick a theme. Shows 6 theme cards with realistic previews. Can switch themes without losing section content (sections re-render with new visual identity).
3. **Customization** — Customize within theme guardrails via `ThemeConfigPanel`:
    - Color preset selector (4-6 curated palettes, or "Custom" for advanced)
    - Typography preset selector (2-3 curated font pairings)
    - Component style options (button shape, card style, image treatment — from theme's `_options` arrays)
    - Feel options (shadow depth, border radius, spacing)
    - Animation options (entrance style, hover effect)
    - Header/footer variant selection
4. **Page Building** — Add/remove/reorder sections per page via drag-and-drop. Configure each section. Select section layout variants.
5. **Preview** — Live iframe preview showing the storefront as customers see it.
6. **Publish** — Go live.

### Builder Components

**PageBuilder** — main interface:

- Left sidebar: Section palette (draggable, grouped by category, filtered by template)
- Center: Canvas (section cards, drag to reorder)
- Right sidebar: Config panel for selected section
- Top bar: Page selector, Preview, Publish, Theme settings

**TemplateSelector** — one-time template choice with previews
**ThemeSelector** — theme cards with realistic mini-previews
**ThemeConfigPanel** — guardrailed customization (presets, not raw inputs)
**SectionPalette** — available sections for this template
**SectionCanvas** — vertical list, drag handles, visibility toggle, delete
**SectionConfigPanel** — dynamic form from configSchema + variant selector
**PreviewFrame** — iframe live preview

### Config Field Types

| Field Type       | Component            | Description                                      |
| ---------------- | -------------------- | ------------------------------------------------ |
| text             | TextInput            | Simple text input                                |
| rich_text_editor | Tiptap editor        | Rich text                                        |
| color_preset     | PresetColorPicker    | Theme's curated palettes (not a raw color wheel) |
| select           | Select dropdown      | Enum options                                     |
| toggle           | Toggle switch        | Boolean                                          |
| number           | NumberInput          | With min/max                                     |
| slider           | Range slider         | 0-1 range                                        |
| image_upload     | ImageUploader        | With crop                                        |
| image_list       | SortableImageGallery | Multiple images                                  |
| product_picker   | ProductSearchModal   | Search/select products                           |
| category_picker  | CategoryTree         | Category selection                               |
| testimonial_list | RepeatableForm       | Testimonial entries                              |
| faq_list         | RepeatableForm       | FAQ entries                                      |
| collection_list  | RepeatableForm       | Collection configs                               |
| datetime         | DateTimePicker       | Date/time                                        |
| variant_selector | VariantGrid          | Visual variant picker for section layouts        |

---

## Caching Strategy

```
storefront:{shop_id}:config          → Resolved theme config (TTL: 60 min)
storefront:{shop_id}:page:{type}     → Resolved page with section data (TTL: 15 min)
storefront:{shop_id}:navigation      → Navigation links (TTL: 60 min)
```

**Invalidation:**

- Config/theme changes → flush `storefront:{shop_id}:*`
- Page section changes → flush `storefront:{shop_id}:page:{type}`
- Product changes → flush `storefront:{shop_id}:page:*`
- Publish/unpublish → flush `storefront:{shop_id}:*`

---

## File Structure

```
app/
├── Contracts/
│   └── StorefrontSectionInterface.php
├── Enums/
│   ├── StorefrontTemplateCategory.php
│   ├── StorefrontAnimationTier.php
│   ├── StorefrontPageType.php
│   ├── StorefrontThemeCategory.php
│   └── SectionCategory.php
├── Http/
│   └── Controllers/
│       ├── Admin/
│       │   └── StorefrontBuilderController.php
│       ├── StorefrontRenderController.php
│       └── StorefrontApiController.php
├── Models/
│   ├── StorefrontTemplate.php
│   ├── StorefrontTheme.php
│   ├── StorefrontConfig.php
│   ├── StorefrontPage.php
│   └── StorefrontMedia.php
├── Services/
│   └── Storefront/
│       ├── StorefrontBuilderService.php
│       ├── StorefrontRenderService.php
│       ├── SectionTypeRegistry.php
│       └── Sections/
│           ├── HeroBannerSection.php
│           ├── FeaturedProductsSection.php
│           ├── ProductGridSection.php
│           ├── CategoryGridSection.php
│           ├── RichTextSection.php
│           ├── ImageWithTextSection.php
│           ├── TestimonialsSection.php
│           ├── AnnouncementBarSection.php
│           ├── NewsletterSignupSection.php
│           ├── BannerSection.php
│           ├── SpacerSection.php
│           ├── GallerySection.php
│           ├── VideoSection.php
│           ├── FaqSection.php
│           ├── ContactFormSection.php
│           ├── LogoCloudSection.php
│           ├── CountdownSection.php
│           ├── CollectionListSection.php
│           ├── RecentlyViewedSection.php
│           └── MapSection.php
└── Providers/
    └── StorefrontServiceProvider.php

database/migrations/
├── xxxx_create_storefront_templates_table.php
├── xxxx_create_storefront_themes_table.php
├── xxxx_create_storefront_configs_table.php
├── xxxx_create_storefront_pages_table.php
└── xxxx_create_storefront_media_table.php

resources/
├── views/
│   └── storefront/
│       └── app.blade.php
└── js/
    ├── storefront/                              (SEPARATE from Inertia admin)
    │   ├── app.tsx                              (entry point)
    │   ├── StorefrontRenderer.tsx
    │   ├── ThemeProvider.tsx
    │   ├── AnimationProvider.tsx
    │   ├── ScrollAnimation.tsx
    │   ├── layouts/
    │   │   ├── registry.ts
    │   │   ├── ClassicCommerceLayout.tsx
    │   │   ├── EditorialShowcaseLayout.tsx
    │   │   ├── MarketplaceHubLayout.tsx
    │   │   ├── ImmersiveExperienceLayout.tsx
    │   │   ├── CatalogProLayout.tsx
    │   │   ├── StorytellerLayout.tsx
    │   │   └── components/
    │   │       ├── headers/
    │   │       │   ├── StandardHeader.tsx
    │   │       │   ├── CenteredLogoHeader.tsx
    │   │       │   ├── TransparentOverlayHeader.tsx
    │   │       │   ├── MinimalHeader.tsx
    │   │       │   └── MegaMenuHeader.tsx
    │   │       └── footers/
    │   │           ├── MultiColumnFooter.tsx
    │   │           ├── MinimalFooter.tsx
    │   │           ├── CenteredFooter.tsx
    │   │           └── MegaFooter.tsx
    │   ├── sections/
    │   │   ├── registry.ts
    │   │   ├── HeroBannerSection/
    │   │   │   ├── index.tsx                    (variant switcher)
    │   │   │   ├── CenteredOverlay.tsx
    │   │   │   ├── SplitImage.tsx
    │   │   │   ├── Slideshow.tsx
    │   │   │   ├── MinimalText.tsx
    │   │   │   ├── VideoBackground.tsx
    │   │   │   └── Asymmetric.tsx
    │   │   ├── FeaturedProductsSection/
    │   │   │   ├── index.tsx
    │   │   │   ├── StandardGrid.tsx
    │   │   │   ├── SpotlightPlusGrid.tsx
    │   │   │   ├── HorizontalScroll.tsx
    │   │   │   ├── Masonry.tsx
    │   │   │   └── Carousel.tsx
    │   │   ├── ProductGridSection/
    │   │   │   ├── index.tsx
    │   │   │   ├── StandardGrid.tsx
    │   │   │   ├── SidebarFilters.tsx
    │   │   │   ├── InfiniteScroll.tsx
    │   │   │   └── GridListToggle.tsx
    │   │   └── ... (same pattern for all section types)
    │   ├── pages/                                (fixed themed pages)
    │   │   ├── Cart.tsx
    │   │   ├── Checkout.tsx
    │   │   ├── CheckoutSuccess.tsx
    │   │   ├── CheckoutPending.tsx
    │   │   ├── auth/
    │   │   │   ├── Login.tsx
    │   │   │   ├── Register.tsx
    │   │   │   ├── ForgotPassword.tsx
    │   │   │   ├── ResetPassword.tsx
    │   │   │   └── VerifyEmail.tsx
    │   │   ├── account/
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Orders.tsx
    │   │   │   ├── OrderDetail.tsx
    │   │   │   └── Profile.tsx
    │   │   └── services/
    │   │       ├── ServiceListing.tsx
    │   │       └── ServiceDetail.tsx
    │   ├── components/
    │   │   ├── ProductCard.tsx
    │   │   ├── CartDrawer.tsx
    │   │   ├── CartItem.tsx
    │   │   ├── QuantitySelector.tsx
    │   │   ├── PriceDisplay.tsx
    │   │   ├── AddressForm.tsx
    │   │   ├── OrderSummary.tsx
    │   │   ├── SearchBar.tsx
    │   │   ├── QuickViewModal.tsx
    │   │   └── ProductViewer3D.tsx              (premium, lazy-loaded)
    │   ├── animation/
    │   │   ├── scroll-reveal.ts                 (IntersectionObserver)
    │   │   ├── parallax.ts                      (parallax utilities)
    │   │   ├── smooth-scroll.ts                 (Lenis wrapper)
    │   │   └── gsap-timelines.ts                (cinematic tier, lazy-loaded)
    │   └── types/
    │       └── storefront.ts
    └── pages/
        └── Admin/
            └── Storefront/
                ├── Builder.tsx
                ├── TemplateSelector.tsx
                ├── ThemeSelector.tsx
                ├── components/
                │   ├── SectionPalette.tsx
                │   ├── SectionCanvas.tsx
                │   ├── SectionConfigPanel.tsx
                │   ├── ThemeConfigPanel.tsx
                │   ├── PreviewFrame.tsx
                │   └── config-fields/
                │       ├── TextField.tsx
                │       ├── PresetColorPicker.tsx
                │       ├── SelectField.tsx
                │       ├── ToggleField.tsx
                │       ├── NumberField.tsx
                │       ├── SliderField.tsx
                │       ├── ImageUploadField.tsx
                │       ├── ImageListField.tsx
                │       ├── RichTextField.tsx
                │       ├── ProductPickerField.tsx
                │       ├── CategoryPickerField.tsx
                │       ├── TestimonialListField.tsx
                │       ├── FaqListField.tsx
                │       ├── CollectionListField.tsx
                │       ├── DateTimeField.tsx
                │       ├── VariantSelectorField.tsx
                │       └── SlideListField.tsx
                └── types/
                    └── builder.ts
```

---

## Integration With Existing ShelfWiser

### What Changes

1. **Shop model** gets a `storefrontConfig()` HasOne relationship
2. **All 5 existing storefront controllers** (`StorefrontController`, `CartController`, `CheckoutController`, `CustomerAuthController`, `CustomerPortalController`) are replaced by two new controllers:
   - `StorefrontRenderController` — ALL page rendering (composable + fixed themed), returns Blade→React
   - `StorefrontApiController` — ALL mutations (cart CRUD, checkout processing, auth, account updates), returns JSON
3. **Existing `StorefrontService`** methods become data sources called by section resolvers and fixed page data loaders
4. **Existing services are reused as-is:** `CartService`, `CheckoutService`, `CustomerService` business logic is unchanged — only the controller layer changes from Inertia responses to Blade views / JSON
5. **Existing `storefront_settings` JSON** superseded by `StorefrontConfig`. Migration copies existing settings.
6. **Customer authentication** guard (`auth('customer')`) and `Password::broker('customers')` are unchanged — the API controller reuses the same auth logic
7. **Vite config** needs second entry point
8. **All storefront routes** migrate from Inertia to the new Blade→React pipeline. No Inertia pages remain on the public storefront.

### What Doesn't Change

- Entire admin panel (POS, inventory, payroll, staff, reports)
- Product, Order, Customer, Payment models and services
- Multi-tenancy (BelongsToTenant, TenantScope)
- Payment gateway integrations (Paystack callback/webhook routes stay as-is)
- CartService, CheckoutService, CustomerService business logic
- Customer auth guard configuration
- API routes for sync, etc.

### Vite Configuration

```ts
export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx', 'resources/js/storefront/app.tsx'],
        }),
    ],
});
```

---

## Design Guidelines

- **Mobile-first.** Most Nigerian customers shop on mobile. Every component must be responsive.
- **Theme defaults must look professional with zero customization.** The builder is for refinement, not rescue.
- **One template, done right, before the next.** No half-implementations across multiple templates.
- **Guardrails, not restrictions.** Every customization option leads to a good result. Ugly is structurally impossible.
- **Speed matters.** Lazy-load animation libraries by tier. No GSAP on Classic Commerce. No Three.js unless Immersive Experience.
- **Premium = earned.** Immersive Experience and 3D viewer are paid features. The free tier (Classic Commerce, Editorial Showcase, Marketplace Hub) must be genuinely excellent on its own.
- **Builder must be fast.** Debounce saves, optimistic UI, no full page reloads during editing.
- **Images are processed.** Resize, optimize, and serve responsive srcsets.
