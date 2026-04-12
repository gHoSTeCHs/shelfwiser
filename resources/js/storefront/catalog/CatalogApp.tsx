import { useState, useMemo } from 'react';
import { ThemeProvider } from '../ThemeProvider';
import { AnimationProvider } from '../AnimationProvider';
import { ClassicCommerceLayout } from '../layouts/ClassicCommerceLayout';
import { sectionRegistry } from '../sections/registry';
import { classicCommerceThemes, classicCommerceTemplate } from './themes';
import {
    mockShop,
    mockNavigation,
    mockCart,
    classicCommerceSections,
    buildSectionData,
} from './mock-data';
import type { CatalogTheme } from './themes';

function VariantSelector({
    label,
    variants,
    current,
    onChange,
}: {
    label: string;
    variants: string[];
    current: string;
    onChange: (v: string) => void;
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 999,
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 40,
            }}
        >
            <span
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                {label}
            </span>
            <select
                value={current}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    appearance: 'none',
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'system-ui, sans-serif',
                    padding: '4px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                }}
            >
                {variants.map((v) => (
                    <option key={v} value={v} style={{ color: '#000' }}>
                        {v.replace(/_/g, ' ')}
                    </option>
                ))}
            </select>
        </div>
    );
}

function SectionPreview({
    type,
    label,
    variants,
    initialVariant,
}: {
    type: string;
    label: string;
    variants: string[];
    initialVariant: string;
}) {
    const [variant, setVariant] = useState(initialVariant);
    const Component = sectionRegistry[type];

    const sectionData = useMemo(
        () => buildSectionData(type, variant, mockShop.slug),
        [type, variant],
    );

    if (!Component) return null;

    return (
        <div style={{ position: 'relative' }}>
            {variants.length > 1 && (
                <VariantSelector
                    label={label}
                    variants={variants}
                    current={variant}
                    onChange={setVariant}
                />
            )}
            <Component
                config={sectionData.config}
                variant={sectionData.variant}
                data={sectionData.data}
                theme={{} as never}
            />
        </div>
    );
}

function StorefrontPreview({ theme, darkMode }: { theme: CatalogTheme; darkMode: boolean }) {
    return (
        <ThemeProvider
            theme={theme}
            template={classicCommerceTemplate}
            darkMode={darkMode}
            darkColors={darkMode ? theme.colorsDark : undefined}
        >
            <AnimationProvider
                template={classicCommerceTemplate}
                animation={theme.animation}
            >
                <ClassicCommerceLayout
                    shop={mockShop}
                    navigation={mockNavigation}
                    cart={mockCart}
                    theme={theme}
                    customer={null}
                >
                    {classicCommerceSections.map((section) => (
                        <SectionPreview
                            key={section.type}
                            type={section.type}
                            label={section.label}
                            variants={section.variants}
                            initialVariant={
                                theme.sectionDefaults[section.type] ?? section.defaultVariant
                            }
                        />
                    ))}
                </ClassicCommerceLayout>
            </AnimationProvider>
        </ThemeProvider>
    );
}

function ThemeSwitcher({
    themes,
    activeIndex,
    onChange,
}: {
    themes: CatalogTheme[];
    activeIndex: number;
    onChange: (i: number) => void;
}) {
    return (
        <div
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backgroundColor: '#111',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '0 24px',
            }}
        >
            <div
                style={{
                    maxWidth: 1320,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    padding: '14px 0',
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.35)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        whiteSpace: 'nowrap',
                        fontFamily: 'system-ui, sans-serif',
                        marginRight: 8,
                    }}
                >
                    Theme
                </span>
                {themes.map((theme, i) => {
                    const isActive = i === activeIndex;
                    return (
                        <button
                            key={theme.name}
                            onClick={() => onChange(i)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: 999,
                                backgroundColor: isActive
                                    ? theme.colors.primary
                                    : 'rgba(255,255,255,0.08)',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                                fontSize: 13,
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontFamily: 'system-ui, sans-serif',
                                transition: 'background-color 0.2s ease',
                            }}
                        >
                            <span
                                style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: theme.colors.primary,
                                    border: isActive
                                        ? '2px solid rgba(255,255,255,0.5)'
                                        : '2px solid rgba(255,255,255,0.15)',
                                    flexShrink: 0,
                                }}
                            />
                            {theme.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ThemeInfo({ theme }: { theme: CatalogTheme }) {
    return (
        <div
            style={{
                backgroundColor: '#111',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexWrap: 'wrap',
            }}
        >
            {[
                ['Font', theme.typography.heading_font],
                ['Weight', theme.typography.heading_weight],
                ['Radius', theme.feel.border_radius ?? '8px'],
                ['Spacing', theme.feel.section_spacing ?? '64px'],
                ['Header', theme.header.variant ?? 'standard'],
                ['Footer', theme.footer.variant ?? 'multi_column'],
                ['Card', theme.product_card.variant ?? 'default'],
                ['Hero', theme.hero.default_variant ?? 'centered_overlay'],
            ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontFamily: 'system-ui, sans-serif',
                        }}
                    >
                        {label}
                    </span>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.7)',
                            fontFamily: 'system-ui, sans-serif',
                        }}
                    >
                        {value}
                    </span>
                </div>
            ))}
        </div>
    );
}

function DarkModeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                border: 'none',
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                color: isDark ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
                transition: 'all 0.2s ease',
            }}
        >
            {isDark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            )}
            {isDark ? 'Dark' : 'Light'}
        </button>
    );
}

export function CatalogApp() {
    const [activeThemeIndex, setActiveThemeIndex] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const activeTheme = classicCommerceThemes[activeThemeIndex];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
            {/* Header bar */}
            <div
                style={{
                    backgroundColor: '#111',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: '-0.02em',
                            fontFamily: 'system-ui, sans-serif',
                        }}
                    >
                        Classic Commerce
                    </h1>
                    <p
                        style={{
                            margin: '4px 0 0',
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.4)',
                            fontFamily: 'system-ui, sans-serif',
                        }}
                    >
                        6 themes &middot; {classicCommerceSections.length} section types &middot; Light &amp; Dark modes
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DarkModeToggle isDark={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.3)',
                            fontFamily: 'system-ui, sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        Dev Catalog
                    </span>
                </div>
            </div>

            {/* Theme switcher */}
            <ThemeSwitcher
                themes={classicCommerceThemes}
                activeIndex={activeThemeIndex}
                onChange={setActiveThemeIndex}
            />

            {/* Theme info strip */}
            <ThemeInfo theme={activeTheme} />

            {/* Live storefront preview — key forces full remount on theme change */}
            <div
                style={{
                    maxWidth: 1440,
                    margin: '0 auto',
                    boxShadow: '0 0 80px -20px rgba(0,0,0,0.8)',
                    overflow: 'hidden',
                }}
            >
                <StorefrontPreview
                    key={`${activeTheme.name}-${darkMode ? 'dark' : 'light'}`}
                    theme={activeTheme}
                    darkMode={darkMode}
                />
            </div>
        </div>
    );
}
