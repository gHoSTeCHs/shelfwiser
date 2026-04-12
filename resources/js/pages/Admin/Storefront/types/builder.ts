import type { Shop } from '@/types/shop';

export interface BuilderConfig {
    id: number;
    shop_id: number;
    theme_id: number;
    color_preset: string | null;
    color_overrides: Record<string, string> | null;
    typography_preset: string | null;
    typography_overrides: Record<string, string> | null;
    component_overrides: Record<string, string> | null;
    feel_overrides: Record<string, string> | null;
    animation_overrides: Record<string, string> | null;
    header_overrides: Record<string, string> | null;
    footer_overrides: Record<string, string> | null;
    logo_path: string | null;
    favicon_path: string | null;
    social_links: Record<string, string> | null;
    global_announcement: GlobalAnnouncement | null;
    seo_defaults: SeoDefaults | null;
    dark_mode_enabled: boolean;
    dark_mode_strategy: string;
    color_preset_dark: string | null;
    color_overrides_dark: Record<string, string> | null;
    is_published: boolean;
    published_at: string | null;
    theme?: BuilderTheme;
    pages?: BuilderPage[];
}

export interface GlobalAnnouncement {
    text?: string;
    enabled?: boolean;
}

export interface SeoDefaults {
    title?: string;
    description?: string;
}

export interface BuilderPage {
    id: number;
    page_type: PageType;
    slug: string;
    title: string;
    sections: BuilderSection[];
    seo_title: string | null;
    seo_description: string | null;
    is_published: boolean;
    sort_order: number;
}

export interface BuilderSection {
    id: string;
    type: string;
    variant: string;
    is_visible: boolean;
    config: Record<string, unknown>;
}

export interface BuilderTheme {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    category: ThemeCategory | null;
    thumbnail_path: string | null;
    ideal_for: string | null;
    theme_config: ThemeConfig;
    default_sections: Record<string, unknown>[];
    is_premium: boolean;
    template?: BuilderTemplate;
}

export interface BuilderTemplate {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    animation_tier: AnimationTier | null;
    structural_config: Record<string, unknown>;
    supported_sections: string[] | null;
    supported_pages: string[] | null;
}

export interface SectionManifestEntry {
    type: string;
    label: string;
    description: string;
    category: SectionCategory;
    icon: string;
    variants: string[];
    config_schema: Record<string, ConfigFieldSchema>;
    default_config: Record<string, unknown>;
    max_per_page: number;
    min_animation_tier: AnimationTier;
}

export interface ConfigFieldSchema {
    type: ConfigFieldType;
    default: unknown;
    description: string;
    options?: unknown[];
    placeholder?: string;
}

export type ConfigFieldType =
    | 'text'
    | 'select'
    | 'toggle'
    | 'number'
    | 'color_preset'
    | 'image_upload'
    | 'image_list'
    | 'datetime'
    | 'slider'
    | 'category_picker'
    | 'product_picker'
    | 'collection_list'
    | 'slide_list'
    | 'rich_text_editor'
    | 'testimonial_list'
    | 'faq_list';

export type PageType =
    | 'home'
    | 'products'
    | 'product_detail'
    | 'cart'
    | 'checkout'
    | 'about'
    | 'contact'
    | 'custom';

export type ThemeCategory = 'general' | 'fashion' | 'grocery' | 'health' | 'tech' | 'artisan';

export type AnimationTier = 'none' | 'subtle' | 'polished' | 'cinematic';

export type SectionCategory =
    | 'hero'
    | 'products'
    | 'content'
    | 'social_proof'
    | 'navigation'
    | 'commerce'
    | 'media'
    | 'layout';

export interface ThemeConfig {
    color_palettes?: ColorPalette[];
    typography_options?: TypographyOption[];
    component_defaults?: Record<string, string>;
    component_options?: Record<string, string[]>;
    feel_defaults?: Record<string, string>;
    feel_options?: Record<string, string[]>;
    animation_defaults?: Record<string, string>;
    animation_options?: Record<string, string[]>;
    header_defaults?: Record<string, string>;
    header_options?: Record<string, string[]>;
    footer_defaults?: Record<string, string>;
    footer_options?: Record<string, string[]>;
    palette_dark?: {
        presets: Array<Record<string, string>>;
    };
    [key: string]: unknown;
}

export interface ColorPalette {
    name: string;
    slug: string;
    colors: Record<string, string>;
}

export interface TypographyOption {
    name: string;
    slug: string;
    heading_font: string;
    body_font: string;
    [key: string]: unknown;
}

export interface BuilderPageProps {
    shop: Shop;
    config: BuilderConfig | null;
    themes: BuilderTheme[];
}

export interface BuilderDataResponse {
    config: BuilderConfig | null;
    pages: BuilderPage[];
    sectionManifest: Record<string, SectionManifestEntry>;
}

export interface DragItemData {
    origin: 'palette' | 'canvas';
    sectionType?: string;
    sectionId?: string;
}
