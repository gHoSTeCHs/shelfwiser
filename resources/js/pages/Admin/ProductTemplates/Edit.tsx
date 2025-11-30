import AppLayout from '@/layouts/AppLayout';
import AdminProductTemplateController from '@/actions/App/Http/Controllers/Admin/AdminProductTemplateController';
import { Head, Link, Form } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Checkbox from '@/components/form/input/Checkbox';
import { ArrowLeft, Plus, Trash2, Package, Box, Save } from 'lucide-react';
import { useState } from 'react';

interface ProductType {
    id: number;
    label: string;
    slug: string;
}

interface ProductCategory {
    id: number;
    name: string;
    slug: string;
}

interface PackagingType {
    name: string;
    display_name: string;
    units_per_package: number;
    is_base_unit: boolean;
    can_break_down: boolean;
}

interface Variant {
    name: string;
    attributes: Record<string, string>;
    packaging_types: PackagingType[];
}

interface TemplateStructure {
    variants: Variant[];
}

interface ProductTemplate {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    product_type_id: number;
    category_id: number | null;
    custom_attributes: Record<string, any> | null;
    template_structure: TemplateStructure;
    has_variants: boolean;
    is_active: boolean;
    product_type: ProductType | null;
    category: ProductCategory | null;
}

interface Props {
    template: ProductTemplate;
    productTypes: ProductType[];
    categories: ProductCategory[];
}

export default function Edit({ template, productTypes, categories }: Props) {
    const [name, setName] = useState(template.name);
    const [description, setDescription] = useState(template.description || '');
    const [productTypeId, setProductTypeId] = useState(template.product_type_id.toString());
    const [categoryId, setCategoryId] = useState(template.category_id?.toString() || '');
    const [hasVariants, setHasVariants] = useState(template.has_variants);
    const [isActive, setIsActive] = useState(template.is_active);
    const [variants, setVariants] = useState<Variant[]>(template.template_structure.variants);
    const [customAttributes, setCustomAttributes] = useState<Record<string, string>>(
        template.custom_attributes as Record<string, string> || {}
    );
    const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });

    const addVariant = () => {
        setVariants([
            ...variants,
            {
                name: `Variant ${variants.length + 1}`,
                attributes: {},
                packaging_types: [
                    {
                        name: 'piece',
                        display_name: 'Piece',
                        units_per_package: 1,
                        is_base_unit: true,
                        can_break_down: false,
                    },
                ],
            },
        ]);
    };

    const removeVariant = (index: number) => {
        if (variants.length <= 1) return;
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: keyof Variant, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const addPackagingType = (variantIndex: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].packaging_types.push({
            name: '',
            display_name: '',
            units_per_package: 1,
            is_base_unit: false,
            can_break_down: true,
        });
        setVariants(newVariants);
    };

    const removePackagingType = (variantIndex: number, pkgIndex: number) => {
        const newVariants = [...variants];
        if (newVariants[variantIndex].packaging_types.length <= 1) return;
        newVariants[variantIndex].packaging_types = newVariants[variantIndex].packaging_types.filter(
            (_, i) => i !== pkgIndex
        );
        setVariants(newVariants);
    };

    const updatePackagingType = (variantIndex: number, pkgIndex: number, field: keyof PackagingType, value: any) => {
        const newVariants = [...variants];
        newVariants[variantIndex].packaging_types[pkgIndex] = {
            ...newVariants[variantIndex].packaging_types[pkgIndex],
            [field]: value,
        };
        setVariants(newVariants);
    };

    const addVariantAttribute = (variantIndex: number, key: string, value: string) => {
        if (!key) return;
        const newVariants = [...variants];
        newVariants[variantIndex].attributes = {
            ...newVariants[variantIndex].attributes,
            [key]: value,
        };
        setVariants(newVariants);
    };

    const removeVariantAttribute = (variantIndex: number, key: string) => {
        const newVariants = [...variants];
        const { [key]: _, ...rest } = newVariants[variantIndex].attributes;
        newVariants[variantIndex].attributes = rest;
        setVariants(newVariants);
    };

    const addCustomAttribute = () => {
        if (!newAttribute.key) return;
        setCustomAttributes({
            ...customAttributes,
            [newAttribute.key]: newAttribute.value,
        });
        setNewAttribute({ key: '', value: '' });
    };

    const removeCustomAttribute = (key: string) => {
        const { [key]: _, ...rest } = customAttributes;
        setCustomAttributes(rest);
    };

    return (
        <AppLayout>
            <Head title={`Edit: ${template.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={AdminProductTemplateController.index.url()}>
                            <Button type="button" variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Edit Template
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {template.name}
                            </p>
                        </div>
                    </div>
                </div>

                <Form
                    action={AdminProductTemplateController.update.url({ product_template: template.id })}
                    method="put"
                >
                    {({ errors, processing }) => (
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Basic Information */}
                                <Card className="p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Basic Information
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">
                                                Template Name <span className="text-error-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                error={!!errors.name}
                                                placeholder="e.g., Peak Milk, Indomie Noodles"
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        <div>
                                            <Label htmlFor="description">Description</Label>
                                            <TextArea
                                                value={description}
                                                onChange={(value) => setDescription(value)}
                                                error={!!errors.description}
                                                rows={3}
                                                placeholder="Brief description of the product template"
                                            />
                                            <input type="hidden" name="description" value={description} />
                                            <InputError message={errors.description} />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <Label>
                                                    Product Type <span className="text-error-500">*</span>
                                                </Label>
                                                <Select
                                                    options={[
                                                        { value: '', label: 'Select type...' },
                                                        ...productTypes.map((type) => ({
                                                            value: type.id.toString(),
                                                            label: type.label,
                                                        })),
                                                    ]}
                                                    defaultValue={productTypeId}
                                                    onChange={(value) => setProductTypeId(value)}
                                                />
                                                <input type="hidden" name="product_type_id" value={productTypeId} />
                                                <InputError message={errors.product_type_id} />
                                            </div>

                                            <div>
                                                <Label>Category</Label>
                                                <Select
                                                    options={[
                                                        { value: '', label: 'Select category...' },
                                                        ...categories.map((cat) => ({
                                                            value: cat.id.toString(),
                                                            label: cat.name,
                                                        })),
                                                    ]}
                                                    defaultValue={categoryId}
                                                    onChange={(value) => setCategoryId(value)}
                                                />
                                                <input type="hidden" name="category_id" value={categoryId} />
                                                <InputError message={errors.category_id} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Variants Structure */}
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Variants Structure
                                        </h2>
                                        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                                            <Plus className="h-4 w-4 mr-1" /> Add Variant
                                        </Button>
                                    </div>

                                    <div className="space-y-6">
                                        {variants.map((variant, variantIndex) => (
                                            <div
                                                key={variantIndex}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-brand-500" />
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            Variant {variantIndex + 1}
                                                        </span>
                                                    </div>
                                                    {variants.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeVariant(variantIndex)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-error-500" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <Label>Variant Name</Label>
                                                        <Input
                                                            type="text"
                                                            value={variant.name}
                                                            onChange={(e) => updateVariant(variantIndex, 'name', e.target.value)}
                                                            placeholder="e.g., Small (150g), Red Berry Flavor"
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name={`template_structure[variants][${variantIndex}][name]`}
                                                            value={variant.name}
                                                        />
                                                    </div>

                                                    {/* Variant Attributes */}
                                                    <div>
                                                        <Label>Attributes</Label>
                                                        <div className="space-y-2">
                                                            {Object.entries(variant.attributes).map(([key, value]) => (
                                                                <div key={key} className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px]">
                                                                        {key}:
                                                                    </span>
                                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                                        {value}
                                                                    </span>
                                                                    <input
                                                                        type="hidden"
                                                                        name={`template_structure[variants][${variantIndex}][attributes][${key}]`}
                                                                        value={value}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeVariantAttribute(variantIndex, key)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3 text-error-500" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Key"
                                                                    className="w-32"
                                                                    id={`attr-key-${variantIndex}`}
                                                                />
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Value"
                                                                    className="flex-1"
                                                                    id={`attr-value-${variantIndex}`}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const keyInput = document.getElementById(`attr-key-${variantIndex}`) as HTMLInputElement;
                                                                        const valueInput = document.getElementById(`attr-value-${variantIndex}`) as HTMLInputElement;
                                                                        addVariantAttribute(variantIndex, keyInput.value, valueInput.value);
                                                                        keyInput.value = '';
                                                                        valueInput.value = '';
                                                                    }}
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Packaging Types */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <Label>Packaging Types</Label>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => addPackagingType(variantIndex)}
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" /> Add
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {variant.packaging_types.map((pkg, pkgIndex) => (
                                                                <div
                                                                    key={pkgIndex}
                                                                    className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800 rounded p-3"
                                                                >
                                                                    <Box className="h-4 w-4 text-gray-400 mt-2" />
                                                                    <div className="flex-1 grid gap-2 sm:grid-cols-4">
                                                                        <div>
                                                                            <Input
                                                                                type="text"
                                                                                placeholder="Name"
                                                                                value={pkg.name}
                                                                                onChange={(e) =>
                                                                                    updatePackagingType(variantIndex, pkgIndex, 'name', e.target.value)
                                                                                }
                                                                            />
                                                                            <input
                                                                                type="hidden"
                                                                                name={`template_structure[variants][${variantIndex}][packaging_types][${pkgIndex}][name]`}
                                                                                value={pkg.name}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Input
                                                                                type="text"
                                                                                placeholder="Display Name"
                                                                                value={pkg.display_name}
                                                                                onChange={(e) =>
                                                                                    updatePackagingType(variantIndex, pkgIndex, 'display_name', e.target.value)
                                                                                }
                                                                            />
                                                                            <input
                                                                                type="hidden"
                                                                                name={`template_structure[variants][${variantIndex}][packaging_types][${pkgIndex}][display_name]`}
                                                                                value={pkg.display_name}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Input
                                                                                type="number"
                                                                                placeholder="Units"
                                                                                value={pkg.units_per_package}
                                                                                onChange={(e) =>
                                                                                    updatePackagingType(variantIndex, pkgIndex, 'units_per_package', parseInt(e.target.value) || 1)
                                                                                }
                                                                            />
                                                                            <input
                                                                                type="hidden"
                                                                                name={`template_structure[variants][${variantIndex}][packaging_types][${pkgIndex}][units_per_package]`}
                                                                                value={pkg.units_per_package}
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <label className="flex items-center gap-1 text-xs">
                                                                                <Checkbox
                                                                                    checked={pkg.is_base_unit}
                                                                                    onChange={(e) =>
                                                                                        updatePackagingType(variantIndex, pkgIndex, 'is_base_unit', e.target.checked)
                                                                                    }
                                                                                />
                                                                                Base
                                                                            </label>
                                                                            <input
                                                                                type="hidden"
                                                                                name={`template_structure[variants][${variantIndex}][packaging_types][${pkgIndex}][is_base_unit]`}
                                                                                value={pkg.is_base_unit ? '1' : '0'}
                                                                            />
                                                                            <input
                                                                                type="hidden"
                                                                                name={`template_structure[variants][${variantIndex}][packaging_types][${pkgIndex}][can_break_down]`}
                                                                                value={pkg.can_break_down ? '1' : '0'}
                                                                            />
                                                                            {variant.packaging_types.length > 1 && (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => removePackagingType(variantIndex, pkgIndex)}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3 text-error-500" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                <Card className="p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Settings
                                    </h2>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3">
                                            <Checkbox
                                                checked={hasVariants}
                                                onChange={(e) => setHasVariants(e.target.checked)}
                                            />
                                            <input type="hidden" name="has_variants" value={hasVariants ? '1' : '0'} />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Has multiple variants
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <Checkbox
                                                checked={isActive}
                                                onChange={(e) => setIsActive(e.target.checked)}
                                            />
                                            <input type="hidden" name="is_active" value={isActive ? '1' : '0'} />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Active (available for use)
                                            </span>
                                        </label>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Custom Attributes
                                    </h2>
                                    <div className="space-y-3">
                                        {Object.entries(customAttributes).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-900 dark:text-white">{String(value)}</span>
                                                    <input
                                                        type="hidden"
                                                        name={`custom_attributes[${key}]`}
                                                        value={String(value)}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeCustomAttribute(key)}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-error-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <div className="space-y-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Attribute name"
                                                    value={newAttribute.key}
                                                    onChange={(e) => setNewAttribute({ ...newAttribute, key: e.target.value })}
                                                />
                                                <Input
                                                    type="text"
                                                    placeholder="Value"
                                                    value={newAttribute.value}
                                                    onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    fullWidth
                                                    onClick={addCustomAttribute}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" /> Add Attribute
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <div className="flex justify-end gap-3">
                                    <Link href={AdminProductTemplateController.index.url()}>
                                        <Button variant="outline">Cancel</Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        loading={processing}
                                        startIcon={<Save className="h-4 w-4" />}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
