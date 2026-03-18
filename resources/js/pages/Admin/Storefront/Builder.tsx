import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { useBuilderStore } from '@/stores/builder-store';
import {
    getBuilderData,
    publish,
    unpublish,
} from '@/actions/App/Http/Controllers/StorefrontBuilderController';
import { callApi } from './lib/api';
import { ThemeSelector } from './ThemeSelector';
import { SectionPalette } from './components/SectionPalette';
import { SectionCanvas } from './components/SectionCanvas';
import { SectionConfigPanel } from './components/SectionConfigPanel';
import { ThemeConfigPanel } from './components/ThemeConfigPanel';
import { PreviewFrame } from './components/PreviewFrame';
import type {
    BuilderConfig,
    BuilderDataResponse,
    BuilderPageProps,
    PageType,
} from './types/builder';
import {
    LayoutTemplate,
    Eye as EyeIcon,
    Palette,
    Globe,
    ChevronRight,
    Layers,
    PanelRight,
    Settings,
} from 'lucide-react';

type MobileTab = 'sections' | 'canvas' | 'settings';

const PAGE_TYPE_LABELS: Record<PageType, string> = {
    home: 'Home',
    products: 'Products',
    product_detail: 'Product Detail',
    cart: 'Cart',
    checkout: 'Checkout',
    about: 'About',
    contact: 'Contact',
    custom: 'Custom',
};

export default function Builder({ shop, config: initialConfig, themes: rawThemes }: BuilderPageProps) {
    const themes = Array.isArray(rawThemes) ? rawThemes : (rawThemes as unknown as { data: typeof rawThemes }).data ?? [];
    const initialConfigUnwrapped = initialConfig && 'data' in initialConfig
        ? (initialConfig as unknown as { data: typeof initialConfig }).data
        : initialConfig;
    const { success, error: showError } = useToast();
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');

    const storeConfig = useBuilderStore((s) => s.config);
    const pages = useBuilderStore((s) => s.pages);
    const selectedPageType = useBuilderStore((s) => s.selectedPageType);
    const activePanel = useBuilderStore((s) => s.activePanel);
    const initialize = useBuilderStore((s) => s.initialize);
    const loadBuilderData = useBuilderStore((s) => s.loadBuilderData);
    const selectPage = useBuilderStore((s) => s.selectPage);
    const setActivePanel = useBuilderStore((s) => s.setActivePanel);
    const togglePreview = useBuilderStore((s) => s.togglePreview);
    const isPreviewOpen = useBuilderStore((s) => s.isPreviewOpen);
    const updateConfigFromResponse = useBuilderStore((s) => s.updateConfigFromResponse);

    useEffect(() => {
        initialize({ shop, config: initialConfigUnwrapped, themes });

        if (initialConfigUnwrapped) {
            (async () => {
                setIsLoadingData(true);
                const result = await callApi<BuilderDataResponse>(
                    getBuilderData({ shop: shop.id }),
                );
                if (result.ok) {
                    loadBuilderData(result.data);
                } else {
                    showError('Failed to load builder data.');
                }
                setIsLoadingData(false);
            })();
        }

        return () => {
            useBuilderStore.getState().reset();
        };
    }, []);

    function handleThemeSelected(data: BuilderDataResponse) {
        loadBuilderData(data);
    }

    async function handlePublishConfirm() {
        setIsPublishing(true);
        try {
            const action = confirmAction === 'publish' ? publish : unpublish;
            const result = await callApi<{ config: BuilderConfig; message: string }>(
                action({ shop: shop.id }),
            );

            if (result.ok) {
                updateConfigFromResponse(result.data.config);
                success(result.data.message);
            } else if (result.status === 403) {
                showError('You do not have permission to manage this storefront.');
            } else {
                showError('Failed to update publish status.');
            }
        } finally {
            setIsPublishing(false);
            setConfirmAction(null);
        }
    }

    if (!storeConfig && themes.length === 0) {
        return (
            <>
                <Head title="Storefront Builder" />
                <EmptyState
                    icon={<LayoutTemplate className="h-12 w-12" />}
                    title="No themes available"
                    description="There are no storefront themes configured yet. Please contact an administrator."
                />
            </>
        );
    }

    if (!storeConfig) {
        return (
            <>
                <Head title="Choose a Theme" />
                <ThemeSelector
                    themes={themes}
                    shop={shop}
                    onThemeSelected={handleThemeSelected}
                />
            </>
        );
    }

    const availablePages = pages.filter(
        (p) => p.page_type !== 'product_detail' && p.page_type !== 'cart' && p.page_type !== 'checkout',
    );

    const rightPanel = activePanel === 'theme-config'
        ? <ThemeConfigPanel />
        : <SectionConfigPanel />;

    return (
        <>
            <Head title="Storefront Builder" />

            <div className="space-y-0">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                                <LayoutTemplate className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                                    {shop.name}
                                </h1>
                                <ChevronRight className="hidden h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600 sm:block" />
                                <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
                                    Storefront
                                </span>
                            </div>
                            <Badge
                                size="sm"
                                color={storeConfig.is_published ? 'success' : 'gray'}
                            >
                                {storeConfig.is_published ? 'Live' : 'Draft'}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                startIcon={<Palette className="h-4 w-4" />}
                                className="hidden sm:inline-flex"
                                onClick={() =>
                                    setActivePanel(
                                        activePanel === 'theme-config' ? null : 'theme-config',
                                    )
                                }
                            >
                                Theme
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                startIcon={<EyeIcon className="h-4 w-4" />}
                                className="hidden sm:inline-flex"
                                onClick={togglePreview}
                            >
                                Preview
                            </Button>
                            <Button
                                size="sm"
                                variant={storeConfig.is_published ? 'outline' : 'primary'}
                                startIcon={<Globe className="h-4 w-4" />}
                                onClick={() =>
                                    setConfirmAction(storeConfig.is_published ? 'unpublish' : 'publish')
                                }
                            >
                                {storeConfig.is_published ? 'Unpublish' : 'Publish'}
                            </Button>
                        </div>
                    </div>

                    {isPreviewOpen ? (
                        <div className="h-[calc(100vh-220px)] min-h-[500px]">
                            <PreviewFrame shopSlug={shop.slug} />
                        </div>
                    ) : isLoadingData ? (
                        <div className="p-5">
                            <div className="hidden gap-4 lg:grid lg:grid-cols-[240px_1fr_320px]">
                                <Skeleton variant="rectangular" height={500} className="rounded-xl" />
                                <SkeletonCard lines={6} showImage />
                                <Skeleton variant="rectangular" height={500} className="rounded-xl" />
                            </div>
                            <div className="lg:hidden">
                                <SkeletonCard lines={6} showImage />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-0.5 overflow-x-auto border-b border-gray-200 px-4 dark:border-gray-800 sm:px-5">
                                {availablePages.map((page) => {
                                    const isActive = selectedPageType === page.page_type;
                                    return (
                                        <button
                                            key={page.page_type}
                                            type="button"
                                            onClick={() => selectPage(page.page_type)}
                                            className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors sm:px-3.5 ${
                                                isActive
                                                    ? 'text-brand-600 dark:text-brand-400'
                                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            {PAGE_TYPE_LABELS[page.page_type] ?? page.title}
                                            <span className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium sm:ml-1.5 ${
                                                isActive
                                                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                                            }`}>
                                                {page.sections.length}
                                            </span>
                                            {isActive && (
                                                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="hidden lg:grid lg:grid-cols-[240px_1fr_320px]">
                                <div className="border-r border-gray-200 p-3 dark:border-gray-800">
                                    <SectionPalette />
                                </div>
                                <div className="min-h-[500px] bg-gray-50/50 p-4 dark:bg-gray-900/30">
                                    <SectionCanvas />
                                </div>
                                <div className="border-l border-gray-200 p-3 dark:border-gray-800">
                                    {rightPanel}
                                </div>
                            </div>

                            <div className="lg:hidden">
                                <div className="min-h-[400px] p-3">
                                    {mobileTab === 'sections' && <SectionPalette />}
                                    {mobileTab === 'canvas' && <SectionCanvas />}
                                    {mobileTab === 'settings' && rightPanel}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {!isLoadingData && !isPreviewOpen && storeConfig && (
                    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95 lg:hidden">
                        <div className="flex">
                            {([
                                { key: 'sections' as const, label: 'Sections', icon: Layers },
                                { key: 'canvas' as const, label: 'Canvas', icon: PanelRight },
                                { key: 'settings' as const, label: 'Settings', icon: Settings },
                            ]).map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setMobileTab(key)}
                                    className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                                        mobileTab === key
                                            ? 'text-brand-600 dark:text-brand-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmAction !== null}
                onClose={() => setConfirmAction(null)}
                onConfirm={handlePublishConfirm}
                title={confirmAction === 'publish' ? 'Publish Storefront' : 'Unpublish Storefront'}
                message={
                    confirmAction === 'publish'
                        ? 'Make your storefront live? Customers will be able to visit your online store.'
                        : 'Take your storefront offline? Customers will no longer be able to access it.'
                }
                confirmLabel={confirmAction === 'publish' ? 'Publish' : 'Unpublish'}
                variant={confirmAction === 'publish' ? 'success' : 'warning'}
                isLoading={isPublishing}
            />
        </>
    );
}

Builder.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
