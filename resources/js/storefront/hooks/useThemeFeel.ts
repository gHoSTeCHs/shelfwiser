import { useMemo } from 'react';
import { useTheme } from './useTheme';
import {
    resolveButtonRadius,
    resolveImageRadius,
    resolveCardBorder,
    resolveHeadingTransform,
    resolveDividerStyle,
} from '../lib/theme-feel';

export function useThemeFeel() {
    const { theme } = useTheme();

    return useMemo(() => ({
        buttonRadius: resolveButtonRadius(theme.components.button_radius as string | undefined),
        imageRadius: resolveImageRadius(theme.feel.image_radius as string | undefined),
        cardBorder: resolveCardBorder(theme.components.card_border as string | undefined),
        headingTransform: resolveHeadingTransform(theme.components.heading_transform as string | undefined),
        dividerStyle: resolveDividerStyle(theme.feel.divider_style as string | undefined),
        isUppercase: (theme.components.heading_transform as string) === 'uppercase',
        isPill: (theme.components.button_radius as string) === 'pill',
        isSharpButton: (theme.components.button_radius as string) === 'sharp',
        hasCardBorder: (theme.components.card_border as string) !== 'none',
        hasDividers: (theme.feel.divider_style as string) !== 'none' && !!theme.feel.divider_style,
    }), [theme.components, theme.feel]);
}
