import { useState } from 'react';
import Badge from '@/components/ui/badge/Badge';
import { useToast } from '@/hooks/useToast';
import { selectTheme, getBuilderData } from '@/actions/App/Http/Controllers/StorefrontBuilderController';
import { callApi } from './lib/api';
import type { Shop } from '@/types/shop';
import type {
    BuilderConfig,
    BuilderDataResponse,
    BuilderTheme,
    ThemeCategory,
} from './types/builder';
import Button from '@/components/ui/button/Button';
import { ArrowLeft, Loader2, Sparkles, Store } from 'lucide-react';

interface ThemeSelectorProps {
    themes: BuilderTheme[];
    shop: Shop;
    onThemeSelected: (data: BuilderDataResponse) => void;
    onCancel?: () => void;
}

const categoryColors: Record<ThemeCategory, 'brand' | 'success' | 'info' | 'warning' | 'purple' | 'blue'> = {
    general: 'brand',
    fashion: 'purple',
    grocery: 'success',
    health: 'info',
    tech: 'blue',
    artisan: 'warning',
};

const categoryGradients: Record<ThemeCategory, string> = {
    general: 'from-brand-500/20 via-brand-400/10 to-transparent',
    fashion: 'from-purple-500/20 via-purple-400/10 to-transparent',
    grocery: 'from-success-500/20 via-success-400/10 to-transparent',
    health: 'from-blue-light-500/20 via-blue-light-400/10 to-transparent',
    tech: 'from-blue-500/20 via-blue-400/10 to-transparent',
    artisan: 'from-warning-500/20 via-warning-400/10 to-transparent',
};

export function ThemeSelector({ themes, shop, onThemeSelected, onCancel }: ThemeSelectorProps) {
    const [selectingThemeId, setSelectingThemeId] = useState<number | null>(null);
    const { error: showError } = useToast();

    async function handleSelectTheme(theme: BuilderTheme) {
        if (selectingThemeId !== null) return;
        setSelectingThemeId(theme.id);

        const themeResult = await callApi<{ config: BuilderConfig; message: string }>(
            selectTheme({ shop: shop.id }),
            { theme_id: theme.id },
        );

        if (!themeResult.ok) {
            showError(
                themeResult.status === 422
                    ? 'The selected theme is no longer available.'
                    : 'Failed to select theme. Please try again.',
            );
            setSelectingThemeId(null);
            return;
        }

        const dataResult = await callApi<BuilderDataResponse>(
            getBuilderData({ shop: shop.id }),
        );

        if (!dataResult.ok) {
            showError('Failed to load builder data. Please try again.');
            setSelectingThemeId(null);
            return;
        }

        onThemeSelected(dataResult.data);
        setSelectingThemeId(null);
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                {onCancel && (
                    <div className="mb-4 flex justify-start">
                        <Button
                            size="sm"
                            variant="outline"
                            startIcon={<ArrowLeft className="h-4 w-4" />}
                            onClick={onCancel}
                        >
                            Back to Builder
                        </Button>
                    </div>
                )}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
                    <Store className="h-7 w-7 text-brand-600 dark:text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {onCancel ? 'Switch Your Theme' : 'Choose Your Storefront Theme'}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                    {onCancel
                        ? 'Select a new theme for your storefront. Your sections will be preserved, but theme styles will change.'
                        : 'Pick a starting point for your online store. Every theme is fully customizable — colors, fonts, layout, and more.'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map((theme, index) => {
                    const isSelecting = selectingThemeId === theme.id;
                    const isDisabled = selectingThemeId !== null && !isSelecting;
                    const gradient = theme.category
                        ? categoryGradients[theme.category]
                        : 'from-gray-500/20 via-gray-400/10 to-transparent';

                    return (
                        <button
                            key={theme.id}
                            type="button"
                            onClick={() => handleSelectTheme(theme)}
                            disabled={isDisabled}
                            style={{ animationDelay: `${index * 60}ms` }}
                            className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 animate-[step-appear_0.5s_cubic-bezier(0.16,1,0.3,1)_both] ${
                                isSelecting
                                    ? 'border-brand-500 shadow-[0_0_0_3px_rgba(70,95,255,0.12)] dark:shadow-[0_0_0_3px_rgba(70,95,255,0.2)]'
                                    : isDisabled
                                      ? 'cursor-not-allowed border-gray-200 opacity-40 dark:border-gray-800'
                                      : 'border-gray-200 shadow-theme-xs hover:border-brand-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-600 dark:hover:bg-white/[0.04]'
                            } bg-white dark:bg-white/[0.03]`}
                        >
                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-gray-800/50">
                                {theme.thumbnail_path ? (
                                    <img
                                        src={theme.thumbnail_path}
                                        alt={theme.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className={`flex h-full items-center justify-center bg-gradient-to-br ${gradient}`}>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 shadow-sm dark:bg-gray-700/60">
                                                <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                                                    {theme.name.substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                                Preview
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {theme.is_premium && (
                                    <div className="absolute right-3 top-3">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
                                            <Sparkles className="h-3 w-3" />
                                            Pro
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2.5 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {theme.name}
                                    </h3>
                                    {theme.category && (
                                        <Badge
                                            size="sm"
                                            color={categoryColors[theme.category] ?? 'gray'}
                                        >
                                            {theme.category}
                                        </Badge>
                                    )}
                                </div>

                                {theme.description && (
                                    <p className="line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                        {theme.description}
                                    </p>
                                )}

                                {theme.ideal_for && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        <span className="font-medium text-gray-500 dark:text-gray-400">Ideal for</span>{' '}
                                        {theme.ideal_for}
                                    </p>
                                )}
                            </div>

                            {isSelecting && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
                                    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Setting up your store...
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
