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
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
    theme: ResolvedTheme;
    template: TemplateData;
    children: ReactNode;
}

export function ThemeProvider({
    theme,
    template,
    children,
}: ThemeProviderProps) {
    const style = useMemo(() => {
        const vars: Record<string, string> = {};

        for (const [key, value] of Object.entries(theme.colors)) {
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
        if (template.structural_config.container_max_width) {
            vars['--container-width'] = template.structural_config
                .container_max_width as string;
        }

        return vars as CSSProperties;
    }, [theme, template]);

    return (
        <ThemeContext.Provider value={{ theme, template }}>
            <div style={style} className="storefront-root">
                {children}
            </div>
        </ThemeContext.Provider>
    );
}
