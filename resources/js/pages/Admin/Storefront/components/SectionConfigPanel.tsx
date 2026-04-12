import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useBuilderStore } from '@/stores/builder-store';
import { updateSection } from '@/actions/App/Http/Controllers/StorefrontBuilderController';
import { callApi } from '../lib/api';
import { getSectionIcon } from '../lib/section-icons';
import { formatFieldName } from '../lib/format-field-name';
import { VariantSelector } from './VariantSelector';
import {
    TextField,
    SelectField,
    ToggleField,
    NumberField,
    SliderField,
    PresetColorPicker,
    DateTimeField,
    RichTextField,
    ImageUploadField,
    ImageListField,
    ProductPickerField,
    CategoryPickerField,
    TestimonialListField,
    FaqListField,
    CollectionListField,
    SlideListField,
} from './config-fields';
import type { BuilderPage, ConfigFieldSchema } from '../types/builder';
import { Loader2, Settings2 } from 'lucide-react';

const DEBOUNCE_MS = 500;

export function SectionConfigPanel() {
    const { error: showError } = useToast();

    const selectedSectionId = useBuilderStore((s) => s.selectedSectionId);
    const pages = useBuilderStore((s) => s.pages);
    const selectedPageType = useBuilderStore((s) => s.selectedPageType);
    const sectionManifest = useBuilderStore((s) => s.sectionManifest);
    const config = useBuilderStore((s) => s.config);
    const isSaving = useBuilderStore((s) => s.isSaving);
    const setSaving = useBuilderStore((s) => s.setSaving);
    const markSaved = useBuilderStore((s) => s.markSaved);
    const updatePageFromResponse = useBuilderStore((s) => s.updatePageFromResponse);

    const currentPage = pages.find((p) => p.page_type === selectedPageType);
    const section = selectedSectionId
        ? currentPage?.sections.find((s) => s.id === selectedSectionId)
        : undefined;
    const manifest = section ? sectionManifest[section.type] : undefined;

    const [configDraft, setConfigDraft] = useState<Record<string, unknown>>({});
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sectionIdRef = useRef<string>('');
    const configDraftRef = useRef(configDraft);
    configDraftRef.current = configDraft;

    const saveConfig = useCallback(
        async (sectionId: string, draft: Record<string, unknown>) => {
            if (!config) return;
            setSaving(true);

            const result = await callApi<{ page: BuilderPage; message: string }>(
                updateSection({
                    shop: config.shop_id,
                    pageType: selectedPageType,
                    sectionId,
                }),
                { config: draft },
            );

            if (result.ok) {
                updatePageFromResponse(result.data.page);
                markSaved();
            } else {
                showError('Failed to save section config.');
                setSaving(false);
            }
        },
        [config, selectedPageType, setSaving, markSaved, updatePageFromResponse, showError],
    );

    useEffect(() => {
        if (!section) return;

        if (sectionIdRef.current && sectionIdRef.current !== section.id) {
            if (timerRef.current) clearTimeout(timerRef.current);
            const outgoingId = sectionIdRef.current;
            const outgoingDraft = configDraftRef.current;
            const savedConfig = useBuilderStore
                .getState()
                .currentPageSections()
                .find((s) => s.id === outgoingId)?.config;

            if (savedConfig && JSON.stringify(outgoingDraft) !== JSON.stringify(savedConfig)) {
                saveConfig(outgoingId, outgoingDraft);
            }
        }

        sectionIdRef.current = section.id;
        setConfigDraft(section.config);
    }, [section?.id]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    function handleFieldChange(fieldName: string, value: unknown) {
        const updated = { ...configDraft, [fieldName]: value };
        setConfigDraft(updated);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            if (sectionIdRef.current) {
                saveConfig(sectionIdRef.current, updated);
            }
        }, DEBOUNCE_MS);
    }

    async function handleVariantChange(variant: string) {
        if (!section || !config) return;
        setSaving(true);

        const result = await callApi<{ page: BuilderPage; message: string }>(
            updateSection({
                shop: config.shop_id,
                pageType: selectedPageType,
                sectionId: section.id,
            }),
            { config: configDraft, variant },
        );

        if (result.ok) {
            updatePageFromResponse(result.data.page);
            markSaved();
        } else {
            showError('Failed to update variant.');
            setSaving(false);
        }
    }

    if (!section || !manifest) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Settings2 className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    No section selected
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Click a section in the canvas to configure it.
                </p>
            </div>
        );
    }

    const Icon = getSectionIcon(manifest.icon);
    const schemaEntries = Object.entries(manifest.config_schema);

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2.5 border-b border-gray-200 pb-3 dark:border-gray-700">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-500/10">
                    <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {manifest.label}
                    </p>
                </div>
                {isSaving && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving
                    </div>
                )}
            </div>

            <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1 pt-4">
                <VariantSelector
                    variants={manifest.variants}
                    currentVariant={section.variant}
                    onChange={handleVariantChange}
                    disabled={isSaving}
                />

                {schemaEntries.map(([fieldName, schema]) => (
                    <div key={fieldName}>
                        {renderField(
                            fieldName,
                            schema,
                            configDraft[fieldName] ?? schema.default,
                            (value) => handleFieldChange(fieldName, value),
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function renderField(
    name: string,
    schema: ConfigFieldSchema,
    value: unknown,
    onChange: (value: unknown) => void,
) {
    switch (schema.type) {
        case 'text':
            return <TextField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'select':
            return <SelectField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'toggle':
            return <ToggleField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'number':
            return <NumberField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'slider':
            return <SliderField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'color_preset':
            return <PresetColorPicker name={name} schema={schema} value={value} onChange={onChange} />;
        case 'datetime':
            return <DateTimeField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'rich_text_editor':
            return <RichTextField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'image_upload':
            return <ImageUploadField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'image_list':
            return <ImageListField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'product_picker':
            return <ProductPickerField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'category_picker':
            return <CategoryPickerField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'testimonial_list':
            return <TestimonialListField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'faq_list':
            return <FaqListField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'collection_list':
            return <CollectionListField name={name} schema={schema} value={value} onChange={onChange} />;
        case 'slide_list':
            return <SlideListField name={name} schema={schema} value={value} onChange={onChange} />;
        default:
            return (
                <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {formatFieldName(name)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {schema.type} field — unsupported
                    </p>
                </div>
            );
    }
}
