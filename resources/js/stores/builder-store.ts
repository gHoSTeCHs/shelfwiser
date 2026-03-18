import { create } from 'zustand';
import type { Shop } from '@/types/shop';
import type {
    BuilderConfig,
    BuilderDataResponse,
    BuilderPage,
    BuilderSection,
    BuilderTheme,
    PageType,
    SectionManifestEntry,
} from '@/pages/Admin/Storefront/types/builder';

type PanelType = 'section-config' | 'theme-config' | null;
type PreviewMode = 'desktop' | 'tablet' | 'mobile';

interface BuilderState {
    shop: Shop | null;
    config: BuilderConfig | null;
    themes: BuilderTheme[];
    pages: BuilderPage[];
    sectionManifest: Record<string, SectionManifestEntry>;
    selectedPageType: PageType;
    selectedSectionId: string | null;
    activePanel: PanelType;
    isPreviewOpen: boolean;
    previewMode: PreviewMode;
    isSaving: boolean;
    lastSaveAt: number | null;

    initialize: (data: { shop: Shop; config: BuilderConfig | null; themes: BuilderTheme[] }) => void;
    loadBuilderData: (data: BuilderDataResponse) => void;
    selectPage: (pageType: PageType) => void;
    selectSection: (sectionId: string | null) => void;
    setActivePanel: (panel: PanelType) => void;
    togglePreview: () => void;
    setPreviewMode: (mode: PreviewMode) => void;
    setSaving: (saving: boolean) => void;
    markSaved: () => void;
    updateConfigFromResponse: (config: BuilderConfig) => void;
    updatePageFromResponse: (page: BuilderPage) => void;
    currentPageSections: () => BuilderSection[];
    reset: () => void;
}

const initialState = {
    shop: null,
    config: null,
    themes: [],
    pages: [],
    sectionManifest: {},
    selectedPageType: 'home' as PageType,
    selectedSectionId: null,
    activePanel: null as PanelType,
    isPreviewOpen: false,
    previewMode: 'desktop' as PreviewMode,
    isSaving: false,
    lastSaveAt: null,
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
    ...initialState,

    initialize({ shop, config, themes }) {
        set({
            shop,
            config,
            themes,
            pages: config?.pages ?? [],
        });
    },

    loadBuilderData(data) {
        set({
            config: data.config,
            pages: data.pages,
            sectionManifest: data.sectionManifest,
            selectedPageType: 'home',
            selectedSectionId: null,
        });
    },

    selectPage(pageType) {
        set({ selectedPageType: pageType, selectedSectionId: null });
    },

    selectSection(sectionId) {
        set({
            selectedSectionId: sectionId,
            activePanel: sectionId ? 'section-config' : null,
        });
    },

    setActivePanel(panel) {
        set({ activePanel: panel });
    },

    togglePreview() {
        set((s) => ({ isPreviewOpen: !s.isPreviewOpen }));
    },

    setPreviewMode(mode) {
        set({ previewMode: mode });
    },

    setSaving(saving) {
        set({ isSaving: saving });
    },

    markSaved() {
        set({ isSaving: false, lastSaveAt: Date.now() });
    },

    updateConfigFromResponse(config) {
        set({ config });
    },

    updatePageFromResponse(page) {
        set((s) => ({
            pages: s.pages.map((p) => (p.page_type === page.page_type ? page : p)),
        }));
    },

    currentPageSections() {
        const { pages, selectedPageType } = get();
        const page = pages.find((p) => p.page_type === selectedPageType);
        return page?.sections ?? [];
    },

    reset() {
        set(initialState);
    },
}));
