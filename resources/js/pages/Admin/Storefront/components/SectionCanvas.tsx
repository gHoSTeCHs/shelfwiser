import { useState } from 'react';
import Badge from '@/components/ui/badge/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { useBuilderStore } from '@/stores/builder-store';
import {
    removeSection,
    reorderSections,
    toggleVisibility,
} from '@/actions/App/Http/Controllers/StorefrontBuilderController';
import { callApi } from '../lib/api';
import { getSectionIcon } from '../lib/section-icons';
import type { BuilderPage, BuilderSection } from '../types/builder';
import {
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff,
    Trash2,
    Layers,
} from 'lucide-react';

export function SectionCanvas() {
    const [deleteTarget, setDeleteTarget] = useState<BuilderSection | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [reorderingId, setReorderingId] = useState<string | null>(null);
    const { error: showError, success: showSuccess } = useToast();

    const sections = useBuilderStore((s) => s.currentPageSections());
    const selectedSectionId = useBuilderStore((s) => s.selectedSectionId);
    const manifest = useBuilderStore((s) => s.sectionManifest);
    const config = useBuilderStore((s) => s.config);
    const selectedPageType = useBuilderStore((s) => s.selectedPageType);
    const selectSection = useBuilderStore((s) => s.selectSection);
    const updatePageFromResponse = useBuilderStore((s) => s.updatePageFromResponse);

    async function handleToggleVisibility(section: BuilderSection) {
        if (!config || togglingId) return;
        setTogglingId(section.id);

        const result = await callApi<{ page: BuilderPage; message: string }>(
            toggleVisibility({
                shop: config.shop_id,
                pageType: selectedPageType,
                sectionId: section.id,
            }),
        );

        if (result.ok) {
            updatePageFromResponse(result.data.page);
        } else {
            showError('Failed to update visibility.');
        }
        setTogglingId(null);
    }

    async function handleMove(sectionId: string, direction: 'up' | 'down') {
        if (!config || reorderingId) return;

        const currentSections = useBuilderStore.getState().currentPageSections();
        const index = currentSections.findIndex((s) => s.id === sectionId);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentSections.length) return;

        setReorderingId(sectionId);

        const reordered = [...currentSections];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        const sectionIds = reordered.map((s) => s.id);

        const result = await callApi<{ page: BuilderPage; message: string }>(
            reorderSections({ shop: config.shop_id, pageType: selectedPageType }),
            { section_ids: sectionIds },
        );

        if (result.ok) {
            updatePageFromResponse(result.data.page);
        } else {
            showError('Failed to reorder sections.');
        }
        setReorderingId(null);
    }

    async function handleDeleteConfirm() {
        if (!config || !deleteTarget) return;
        setIsDeleting(true);

        const result = await callApi<{ page: BuilderPage; message: string }>(
            removeSection({
                shop: config.shop_id,
                pageType: selectedPageType,
                sectionId: deleteTarget.id,
            }),
        );

        if (result.ok) {
            updatePageFromResponse(result.data.page);
            if (selectedSectionId === deleteTarget.id) {
                selectSection(null);
            }
            showSuccess('Section removed.');
        } else {
            showError('Failed to remove section.');
        }

        setIsDeleting(false);
        setDeleteTarget(null);
    }

    if (sections.length === 0) {
        return (
            <EmptyState
                icon={<Layers className="h-10 w-10" />}
                title="No sections yet"
                description="Add sections from the palette to build your page."
                className="py-16"
            />
        );
    }

    return (
        <>
            <div className="space-y-2">
                {sections.map((section, index) => {
                    const manifestEntry = manifest[section.type];
                    const Icon = manifestEntry ? getSectionIcon(manifestEntry.icon) : Layers;
                    const label = manifestEntry?.label ?? section.type;
                    const VisibilityIcon = section.is_visible ? Eye : EyeOff;
                    const isSelected = selectedSectionId === section.id;
                    const isFirst = index === 0;
                    const isLast = index === sections.length - 1;

                    return (
                        <div
                            key={section.id}
                            className={`group flex items-center gap-2 rounded-lg border bg-white p-2.5 transition-all dark:bg-gray-800/50 ${
                                isSelected
                                    ? 'border-brand-500 ring-2 ring-brand-500/20 dark:border-brand-400'
                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                            } ${!section.is_visible ? 'opacity-60' : ''}`}
                        >
                            <div className="flex shrink-0 flex-col gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => handleMove(section.id, 'up')}
                                    disabled={isFirst || reorderingId !== null}
                                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                                    aria-label="Move up"
                                >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMove(section.id, 'down')}
                                    disabled={isLast || reorderingId !== null}
                                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                                    aria-label="Move down"
                                >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => selectSection(section.id)}
                                className="flex min-w-0 flex-1 items-center gap-2.5"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                        {label}
                                    </p>
                                    {section.variant !== 'default' && (
                                        <Badge size="sm" color="gray" className="mt-0.5">
                                            {section.variant.replace(/_/g, ' ')}
                                        </Badge>
                                    )}
                                </div>
                            </button>

                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                    type="button"
                                    onClick={() => handleToggleVisibility(section)}
                                    disabled={togglingId !== null}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                                    aria-label={section.is_visible ? 'Hide section' : 'Show section'}
                                >
                                    <VisibilityIcon className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(section)}
                                    className="rounded p-1 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                                    aria-label="Delete section"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ConfirmDialog
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="Remove Section"
                message={`Remove this ${manifest[deleteTarget?.type ?? '']?.label ?? 'section'} from the page? This cannot be undone.`}
                confirmLabel="Remove"
                variant="danger"
                isLoading={isDeleting}
            />
        </>
    );
}
