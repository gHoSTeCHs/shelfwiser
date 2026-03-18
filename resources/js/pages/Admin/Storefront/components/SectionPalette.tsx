import { useMemo, useState } from 'react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import { useToast } from '@/hooks/useToast';
import { useBuilderStore } from '@/stores/builder-store';
import { addSection } from '@/actions/App/Http/Controllers/StorefrontBuilderController';
import { callApi } from '../lib/api';
import { getSectionIcon } from '../lib/section-icons';
import type { BuilderPage, SectionCategory, SectionManifestEntry } from '../types/builder';
import { Search, Plus, Loader2 } from 'lucide-react';

const CATEGORY_LABELS: Record<SectionCategory, string> = {
    hero: 'Hero',
    products: 'Products',
    content: 'Content',
    social_proof: 'Social Proof',
    navigation: 'Navigation',
    commerce: 'Commerce',
    media: 'Media',
    layout: 'Layout',
};

const CATEGORY_ORDER: SectionCategory[] = [
    'hero', 'products', 'content', 'social_proof', 'navigation', 'commerce', 'media', 'layout',
];

export function SectionPalette() {
    const [search, setSearch] = useState('');
    const [addingType, setAddingType] = useState<string | null>(null);
    const { error: showError, success: showSuccess } = useToast();

    const manifest = useBuilderStore((s) => s.sectionManifest);
    const config = useBuilderStore((s) => s.config);
    const selectedPageType = useBuilderStore((s) => s.selectedPageType);
    const updatePageFromResponse = useBuilderStore((s) => s.updatePageFromResponse);

    const groupedEntries = useMemo(() => {
        const entries = Object.values(manifest);
        const filtered = search
            ? entries.filter((e) => e.label.toLowerCase().includes(search.toLowerCase()))
            : entries;

        const groups: Partial<Record<SectionCategory, SectionManifestEntry[]>> = {};
        for (const entry of filtered) {
            const cat = entry.category;
            if (!groups[cat]) groups[cat] = [];
            groups[cat]!.push(entry);
        }
        return groups;
    }, [manifest, search]);

    function getUsageCount(type: string): number {
        return useBuilderStore.getState().currentPageSections().filter((s) => s.type === type).length;
    }

    async function handleAdd(entry: SectionManifestEntry) {
        if (!config || addingType) return;

        const usage = getUsageCount(entry.type);
        if (entry.max_per_page > 0 && usage >= entry.max_per_page) return;

        setAddingType(entry.type);

        const variant = entry.variants[0] ?? 'default';
        const result = await callApi<{ page: BuilderPage; message: string }>(
            addSection({ shop: config.shop_id, pageType: selectedPageType }),
            { type: entry.type, variant },
        );

        if (result.ok) {
            updatePageFromResponse(result.data.page);
            showSuccess(`${entry.label} added`);
        } else {
            showError('Failed to add section.');
        }
        setAddingType(null);
    }

    const hasEntries = Object.keys(groupedEntries).length > 0;

    return (
        <div className="flex h-full flex-col">
            <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search sections..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-600"
                />
            </div>

            <div className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
                {!hasEntries && (
                    <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                        {search ? 'No sections match your search.' : 'No sections available.'}
                    </p>
                )}

                {CATEGORY_ORDER.map((category) => {
                    const entries = groupedEntries[category];
                    if (!entries?.length) return null;

                    return (
                        <CollapsibleSection
                            key={category}
                            title={CATEGORY_LABELS[category]}
                            defaultOpen={category === 'hero' || category === 'content'}
                            className="rounded-lg"
                            contentClassName="space-y-1.5 pt-1"
                        >
                            {entries.map((entry) => {
                                const usage = getUsageCount(entry.type);
                                const isAtCapacity = entry.max_per_page > 0 && usage >= entry.max_per_page;
                                const isAdding = addingType === entry.type;
                                const Icon = getSectionIcon(entry.icon);

                                return (
                                    <button
                                        key={entry.type}
                                        type="button"
                                        onClick={() => handleAdd(entry)}
                                        disabled={isAtCapacity || isAdding}
                                        className={`flex w-full items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5 text-left transition-all dark:border-gray-700 dark:bg-gray-800/50 ${
                                            isAtCapacity
                                                ? 'cursor-not-allowed opacity-40'
                                                : 'hover:border-brand-300 hover:shadow-sm dark:hover:border-brand-600'
                                        }`}
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                                            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                {entry.label}
                                            </p>
                                            <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                                                {entry.description}
                                            </p>
                                        </div>
                                        {isAdding ? (
                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-500" />
                                        ) : (
                                            <Plus className="h-4 w-4 shrink-0 text-gray-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </CollapsibleSection>
                    );
                })}
            </div>
        </div>
    );
}
