import {
    type CSSProperties,
    type ReactNode,
    createContext,
    useMemo,
} from 'react';
import type { ResolvedTheme, TemplateData } from './types/storefront';

export interface ThemeContextValue {
    theme: ResolvedTheme;
    template: TemplateData;
    isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
    theme: ResolvedTheme;
    template: TemplateData;
    darkMode?: boolean;
    darkColors?: Record<string, string>;
    children: ReactNode;
}

export function ThemeProvider({
    theme,
    template,
    darkMode = false,
    darkColors,
    children,
}: ThemeProviderProps) {
    const style = useMemo(() => {
        const vars: Record<string, string> = {};

        const activeColors = darkMode && darkColors
            ? { ...theme.colors, ...darkColors }
            : theme.colors;

        for (const [key, value] of Object.entries(activeColors)) {
            vars[`--color-${key}`] = value;
        }

        if (theme.typography.heading_font) {
            vars['--font-heading'] =
                `"${theme.typography.heading_font}", sans-serif`;
        }
        if (theme.typography.body_font) {
            vars['--font-body'] = `"${theme.typography.body_font}", sans-serif`;
        }
        if (theme.typography.base_size) {
            vars['--font-base-size'] = `${theme.typography.base_size}px`;
        }
        if (theme.typography.line_height) {
            vars['--line-height'] = String(theme.typography.line_height);
        }
        if (theme.feel.border_radius) {
            vars['--radius'] = theme.feel.border_radius;
        }
        if (theme.feel.section_spacing) {
            vars['--section-spacing'] = theme.feel.section_spacing;
        }
        if (theme.feel.shadow_depth) {
            vars['--shadow-depth'] = theme.feel.shadow_depth;
        }
        if (theme.feel.image_radius) {
            vars['--image-radius'] = theme.feel.image_radius as string;
        }
        if (theme.feel.divider_style) {
            vars['--divider-style'] = theme.feel.divider_style as string;
        }

        const btnRadius = (theme.components.button_radius as string) ?? 'rounded';
        vars['--btn-radius'] = btnRadius === 'pill'
            ? '999px'
            : btnRadius === 'sharp'
              ? `calc(${theme.feel.border_radius ?? '8px'} * 0.5)`
              : (theme.feel.border_radius ?? '8px');

        const imgRadius = (theme.feel.image_radius as string) ?? 'soft';
        vars['--img-radius'] = imgRadius === 'sharp'
            ? `calc(${theme.feel.border_radius ?? '8px'} * 0.5)`
            : imgRadius === 'rounded'
              ? `calc(${theme.feel.border_radius ?? '8px'} * 2)`
              : (theme.feel.border_radius ?? '8px');

        const cardBorder = (theme.components.card_border as string) ?? 'subtle';
        vars['--card-border'] = cardBorder === 'visible'
            ? '1px solid var(--color-border, #e5e7eb)'
            : cardBorder === 'none'
              ? '1px solid transparent'
              : '1px solid color-mix(in srgb, var(--color-border, #e5e7eb) 50%, transparent)';

        vars['--heading-transform'] = (theme.components.heading_transform as string) === 'uppercase'
            ? 'uppercase'
            : 'none';
        if (template.structural_config.container_max_width) {
            vars['--container-width'] = template.structural_config
                .container_max_width as string;
        }

        return vars as CSSProperties;
    }, [theme, template, darkMode, darkColors]);

    return (
        <ThemeContext.Provider value={{ theme, template, isDark: darkMode }}>
            <div style={style} className="storefront-root">
                {children}
            </div>
        </ThemeContext.Provider>
    );
}
