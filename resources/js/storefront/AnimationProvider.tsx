import { createContext, useMemo } from 'react';
import type { TemplateData, AnimationConfig, AnimationTier } from './types/storefront';

export interface AnimationContextValue {
    tier: AnimationTier;
    entranceStyle: string;
    hoverStyle: string;
    isReduced: boolean;
}

export const AnimationContext = createContext<AnimationContextValue | null>(null);

interface AnimationProviderProps {
    template: TemplateData;
    animation: AnimationConfig;
    children: React.ReactNode;
}

export function AnimationProvider({ template, animation, children }: AnimationProviderProps) {
    const value = useMemo(() => {
        const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        return {
            tier: prefersReduced ? ('none' as AnimationTier) : template.animation_tier,
            entranceStyle: animation.entrance_style ?? 'fade_up',
            hoverStyle: animation.hover_style ?? 'none',
            isReduced: prefersReduced,
        };
    }, [template, animation]);

    return (
        <AnimationContext.Provider value={value}>
            {children}
        </AnimationContext.Provider>
    );
}
