import { useCallback, useEffect, useRef, useState } from 'react';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import Toggle from '@/components/ui/toggle/Toggle';
import Button from '@/components/ui/button/Button';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useBuilderStore } from '@/stores/builder-store';
import {
    updateConfig,
    resetToDefaults,
} from '@/actions/App/Http/Controllers/StorefrontBuilderController';
import { callApi } from '../lib/api';
import { formatFieldName } from '../lib/format-field-name';
import type { BuilderConfig } from '../types/builder';
import {
    Palette,
    Type,
    Layout,
    Sparkles,
    Zap,
    PanelTop,
    PanelBottom,
    Megaphone,
    Share2,
    Search,
    Loader2,
    RotateCcw,
} from 'lucide-react';

const DEBOUNCE_MS = 500;

interface ThemeConfigDraft {
    color_preset: string | null;
    color_overrides: Record<string, string> | null;
    typography_preset: string | null;
    typography_overrides: Record<string, string> | null;
    component_overrides: Record<string, string> | null;
    feel_overrides: Record<string, string> | null;
    animation_overrides: Record<string, string> | null;
    header_overrides: Record<string, string> | null;
    footer_overrides: Record<string, string> | null;
    global_announcement: { text?: string; enabled?: boolean } | null;
    social_links: Record<string, string> | null;
    seo_defaults: { title?: string; description?: string } | null;
}

function configToDraft(config: BuilderConfig): ThemeConfigDraft {
    return {
        color_preset: config.color_preset,
        color_overrides: config.color_overrides,
        typography_preset: config.typography_preset,
        typography_overrides: config.typography_overrides,
        component_overrides: config.component_overrides,
        feel_overrides: config.feel_overrides,
        animation_overrides: config.animation_overrides,
        header_overrides: config.header_overrides,
        footer_overrides: config.footer_overrides,
        global_announcement: config.global_announcement,
        social_links: config.social_links,
        seo_defaults: config.seo_defaults,
    };
}

const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'whatsapp'];

export function ThemeConfigPanel() {
    const { error: showError, success: showSuccess } = useToast();
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const config = useBuilderStore((s) => s.config);
    const isSaving = useBuilderStore((s) => s.isSaving);
    const setSaving = useBuilderStore((s) => s.setSaving);
    const markSaved = useBuilderStore((s) => s.markSaved);
    const updateConfigFromResponse = useBuilderStore((s) => s.updateConfigFromResponse);

    const [draft, setDraft] = useState<ThemeConfigDraft>(() =>
        config ? configToDraft(config) : ({} as ThemeConfigDraft),
    );
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const draftRef = useRef(draft);
    draftRef.current = draft;

    useEffect(() => {
        if (config) setDraft(configToDraft(config));
    }, [config?.id]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const saveImmediately = useCallback(
        async (overrideDraft: ThemeConfigDraft) => {
            if (!config) return;
            setSaving(true);

            const result = await callApi<{ config: BuilderConfig; message: string }>(
                updateConfig({ shop: config.shop_id }),
                overrideDraft,
            );

            if (result.ok) {
                updateConfigFromResponse(result.data.config);
                markSaved();
            } else {
                showError('Failed to save theme settings.');
                setSaving(false);
            }
        },
        [config?.shop_id, setSaving, markSaved, updateConfigFromResponse, showError],
    );

    const saveDebounced = useCallback(
        (updated: ThemeConfigDraft) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                saveImmediately(updated);
            }, DEBOUNCE_MS);
        },
        [saveImmediately],
    );

    function updateDraft(partial: Partial<ThemeConfigDraft>) {
        const updated = { ...draftRef.current, ...partial };
        setDraft(updated);
        saveDebounced(updated);
    }

    function updateDraftImmediate(partial: Partial<ThemeConfigDraft>) {
        const updated = { ...draftRef.current, ...partial };
        setDraft(updated);
        if (timerRef.current) clearTimeout(timerRef.current);
        saveImmediately(updated);
    }

    function updateOverride(
        field: keyof ThemeConfigDraft,
        key: string,
        value: string,
    ) {
        const existing = (draftRef.current[field] as Record<string, string> | null) ?? {};
        updateDraft({ [field]: { ...existing, [key]: value } });
    }

    async function handleReset() {
        if (!config) return;
        setIsResetting(true);

        const result = await callApi<{ config: BuilderConfig; message: string }>(
            resetToDefaults({ shop: config.shop_id }),
        );

        if (result.ok) {
            updateConfigFromResponse(result.data.config);
            setDraft(configToDraft(result.data.config));
            showSuccess('Theme reset to defaults.');
        } else {
            showError('Failed to reset theme.');
        }

        setIsResetting(false);
        setShowResetConfirm(false);
    }

    if (!config) return null;

    const tc = (config.theme?.theme_config ?? {}) as Record<string, unknown>;
    const palettePresets = ((tc.palette as Record<string, unknown>)?.presets ?? []) as Array<Record<string, string>>;
    const typographyOptions = ((tc.typography as Record<string, unknown>)?.options ?? []) as Array<Record<string, string>>;
    const componentDefaults = (tc.components ?? {}) as Record<string, string>;
    const feelDefaults = (tc.feel ?? {}) as Record<string, string>;
    const animationDefaults = (tc.animation ?? {}) as Record<string, unknown>;
    const headerDefaults = (tc.header ?? {}) as Record<string, unknown>;
    const footerDefaults = (tc.footer ?? {}) as Record<string, unknown>;

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-500/10">
                        <Palette className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Theme Settings
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isSaving && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        aria-label="Reset to defaults"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1 pt-3">
                <CollapsibleSection title="Color Palette" icon={Palette} defaultOpen>
                    {palettePresets.length > 0 ? (
                        <div className="space-y-2">
                            {palettePresets.map((preset) => {
                                const isActive = draft.color_preset === preset.name;
                                return (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => updateDraftImmediate({ color_preset: preset.name, color_overrides: null })}
                                        className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all ${
                                            isActive
                                                ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-500/5'
                                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex gap-0.5">
                                            {['primary', 'secondary', 'accent', 'background'].map((key) => (
                                                <div
                                                    key={key}
                                                    className="h-6 w-6 rounded-sm first:rounded-l-md last:rounded-r-md"
                                                    style={{ backgroundColor: preset[key] }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {preset.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="py-3 text-center text-xs text-gray-400 dark:text-gray-500">
                            No predefined palettes for this theme.
                        </p>
                    )}
                </CollapsibleSection>

                <CollapsibleSection title="Typography" icon={Type} defaultOpen>
                    {typographyOptions.length > 0 ? (
                        <div className="space-y-2">
                            {typographyOptions.map((opt) => {
                                const isActive = draft.typography_preset === opt.name;
                                return (
                                    <button
                                        key={opt.name}
                                        type="button"
                                        onClick={() => updateDraftImmediate({ typography_preset: opt.name, typography_overrides: null })}
                                        className={`flex w-full flex-col rounded-lg border p-3 text-left transition-all ${
                                            isActive
                                                ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-500/5'
                                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {opt.name}
                                        </span>
                                        <span className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                                            {opt.heading_font} / {opt.body_font}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="py-3 text-center text-xs text-gray-400 dark:text-gray-500">
                            No typography options for this theme.
                        </p>
                    )}
                </CollapsibleSection>

                <CollapsibleSection title="Components" icon={Layout}>
                    <div className="space-y-3">
                        {Object.entries(componentDefaults).map(([key, defaultVal]) => {
                            const currentVal = draft.component_overrides?.[key] ?? defaultVal;
                            return (
                                <div key={key}>
                                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {formatFieldName(key)}
                                    </label>
                                    <Input
                                        type="text"
                                        value={currentVal}
                                        placeholder={defaultVal}
                                        onChange={(e) => updateOverride('component_overrides', key, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Feel" icon={Sparkles}>
                    <div className="space-y-3">
                        {Object.entries(feelDefaults).map(([key, defaultVal]) => {
                            const currentVal = draft.feel_overrides?.[key] ?? defaultVal;
                            return (
                                <div key={key}>
                                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {formatFieldName(key)}
                                    </label>
                                    <Input
                                        type="text"
                                        value={currentVal}
                                        placeholder={defaultVal}
                                        onChange={(e) => updateOverride('feel_overrides', key, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Animation" icon={Zap}>
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Entrance Style
                            </label>
                            <Select
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'fade-up', label: 'Fade Up' },
                                    { value: 'fade-in', label: 'Fade In' },
                                    { value: 'slide-left', label: 'Slide Left' },
                                    { value: 'scale-in', label: 'Scale In' },
                                ]}
                                value={draft.animation_overrides?.entrance ?? String(animationDefaults.entrance ?? 'fade-up')}
                                onChange={(val) => updateOverride('animation_overrides', 'entrance', val)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Duration (ms)
                            </label>
                            <Input
                                type="number"
                                value={draft.animation_overrides?.duration ?? String(animationDefaults.duration ?? 600)}
                                placeholder="600"
                                onChange={(e) => updateOverride('animation_overrides', 'duration', e.target.value)}
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Header" icon={PanelTop}>
                    <div className="space-y-2.5">
                        {Object.entries(headerDefaults).map(([key, defaultVal]) => {
                            if (typeof defaultVal === 'boolean') {
                                const currentVal = draft.header_overrides?.[key] !== undefined
                                    ? draft.header_overrides[key] === 'true'
                                    : defaultVal;
                                return (
                                    <Toggle
                                        key={key}
                                        label={formatFieldName(key)}
                                        checked={currentVal}
                                        onChange={(checked) => updateOverride('header_overrides', key, String(checked))}
                                        size="sm"
                                    />
                                );
                            }
                            return null;
                        })}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Footer" icon={PanelBottom}>
                    <div className="space-y-3">
                        {typeof footerDefaults.style === 'string' && (
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Footer Style
                                </label>
                                <Select
                                    options={[
                                        { value: 'minimal', label: 'Minimal' },
                                        { value: 'multi_column', label: 'Multi Column' },
                                        { value: 'centered', label: 'Centered' },
                                    ]}
                                    value={draft.footer_overrides?.style ?? String(footerDefaults.style)}
                                    onChange={(val) => updateOverride('footer_overrides', 'style', val)}
                                />
                            </div>
                        )}
                        {Object.entries(footerDefaults).map(([key, defaultVal]) => {
                            if (typeof defaultVal === 'boolean') {
                                const currentVal = draft.footer_overrides?.[key] !== undefined
                                    ? draft.footer_overrides[key] === 'true'
                                    : defaultVal;
                                return (
                                    <Toggle
                                        key={key}
                                        label={formatFieldName(key)}
                                        checked={currentVal}
                                        onChange={(checked) => updateOverride('footer_overrides', key, String(checked))}
                                        size="sm"
                                    />
                                );
                            }
                            return null;
                        })}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Announcement" icon={Megaphone}>
                    <div className="space-y-3">
                        <Toggle
                            label="Show announcement bar"
                            checked={draft.global_announcement?.enabled ?? false}
                            onChange={(checked) =>
                                updateDraft({
                                    global_announcement: {
                                        ...draftRef.current.global_announcement,
                                        enabled: checked,
                                    },
                                })
                            }
                            size="sm"
                        />
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Announcement Text
                            </label>
                            <Input
                                type="text"
                                value={draft.global_announcement?.text ?? ''}
                                placeholder="Free delivery on orders over ₦10,000!"
                                onChange={(e) =>
                                    updateDraft({
                                        global_announcement: {
                                            ...draftRef.current.global_announcement,
                                            text: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Social Links" icon={Share2}>
                    <div className="space-y-3">
                        {SOCIAL_PLATFORMS.map((platform) => (
                            <div key={platform}>
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {formatFieldName(platform)}
                                </label>
                                <Input
                                    type="text"
                                    value={draft.social_links?.[platform] ?? ''}
                                    placeholder={`https://${platform}.com/...`}
                                    onChange={(e) => {
                                        const links = { ...(draft.social_links ?? {}) };
                                        if (e.target.value) {
                                            links[platform] = e.target.value;
                                        } else {
                                            delete links[platform];
                                        }
                                        updateDraft({ social_links: Object.keys(links).length > 0 ? links : null });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="SEO Defaults" icon={Search}>
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Default Page Title
                            </label>
                            <Input
                                type="text"
                                value={draft.seo_defaults?.title ?? ''}
                                placeholder="My Store — Shop Online"
                                onChange={(e) =>
                                    updateDraft({
                                        seo_defaults: {
                                            ...draftRef.current.seo_defaults,
                                            title: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Default Description
                            </label>
                            <TextArea
                                value={draft.seo_defaults?.description ?? ''}
                                placeholder="Shop quality products online..."
                                rows={3}
                                onChange={(val) =>
                                    updateDraft({
                                        seo_defaults: {
                                            ...draftRef.current.seo_defaults,
                                            description: val,
                                        },
                                    })
                                }
                            />
                        </div>
                    </div>
                </CollapsibleSection>
            </div>

            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleReset}
                title="Reset Theme to Defaults"
                message="Reset all color, typography, and layout customizations to theme defaults? This won't affect your page sections."
                confirmLabel="Reset"
                variant="warning"
                isLoading={isResetting}
            />
        </div>
    );
}
