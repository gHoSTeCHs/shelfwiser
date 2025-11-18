import AppLayout from '@/layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import InputError from '@/components/form/InputError';
import Checkbox from '@/components/form/input/Checkbox';
import { ArrowLeft, Plus, Trash2, Package, Box } from 'lucide-react';
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

interface Props {
    productTypes: ProductType[];
    categories: ProductCategory[];
}

export default function Create({ productTypes, categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        product_type_id: '',
        category_id: '',
        has_variants: true,
        is_active: true,
        template_structure: {
            variants: [
                {
                    name: 'Default',
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
            ] as Variant[],
        },
        custom_attributes: {} as Record<string, string>,
    });

    const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/product-templates');
    };

    const addVariant = () => {
        setData('template_structure', {
            ...data.template_structure,
            variants: [
                ...data.template_structure.variants,
                {
                    name: `Variant ${data.template_structure.variants.length + 1}`,
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
            ],
        });
    };

    const removeVariant = (index: number) => {
        if (data.template_structure.variants.length <= 1) return;
        setData('template_structure', {
            ...data.template_structure,
            variants: data.template_structure.variants.filter((_, i) => i !== index),
        });
    };

    const updateVariant = (index: number, field: keyof Variant, value: any) => {
        const variants = [...data.template_structure.variants];
        variants[index] = { ...variants[index], [field]: value };
        setData('template_structure', { ...data.template_structure, variants });
    };

    const addPackagingType = (variantIndex: number) => {
        const variants = [...data.template_structure.variants];
        variants[variantIndex].packaging_types.push({
            name: '',
            display_name: '',
            units_per_package: 1,
            is_base_unit: false,
            can_break_down: true,
        });
        setData('template_structure', { ...data.template_structure, variants });
    };

    const removePackagingType = (variantIndex: number, pkgIndex: number) => {
        const variants = [...data.template_structure.variants];
        if (variants[variantIndex].packaging_types.length <= 1) return;
        variants[variantIndex].packaging_types = variants[variantIndex].packaging_types.filter(
            (_, i) => i !== pkgIndex
        );
        setData('template_structure', { ...data.template_structure, variants });
    };

    const updatePackagingType = (variantIndex: number, pkgIndex: number, field: keyof PackagingType, value: any) => {
        const variants = [...data.template_structure.variants];
        variants[variantIndex].packaging_types[pkgIndex] = {
            ...variants[variantIndex].packaging_types[pkgIndex],
            [field]: value,
        };
        setData('template_structure', { ...data.template_structure, variants });
    };

    const addVariantAttribute = (variantIndex: number, key: string, value: string) => {
        if (!key) return;
        const variants = [...data.template_structure.variants];
        variants[variantIndex].attributes = {
            ...variants[variantIndex].attributes,
            [key]: value,
        };
        setData('template_structure', { ...data.template_structure, variants });
    };

    const removeVariantAttribute = (variantIndex: number, key: string) => {
        const variants = [...data.template_structure.variants];
        const { [key]: _, ...rest } = variants[variantIndex].attributes;
        variants[variantIndex].attributes = rest;
        setData('template_structure', { ...data.template_structure, variants });
    };

    const addCustomAttribute = () => {
        if (!newAttribute.key) return;
        setData('custom_attributes', {
            ...data.custom_attributes,
            [newAttribute.key]: newAttribute.value,
        });
        setNewAttribute({ key: '', value: '' });
    };

    const removeCustomAttribute = (key: string) => {
        const { [key]: _, ...rest } = data.custom_attributes;
        setData('custom_attributes', rest);
    };

    return (
        <AppLayout>
            <Head title="Create Product Template" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/product-templates">
                            <Button type="button" variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Create Product Template
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Create a new system-wide product template
                            </p>
                        </div>
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Creating...' : 'Create Template'}
                    </Button>
                </div>

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
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={!!errors.name}
                                        placeholder="e.g., Peak Milk, Indomie Noodles"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <TextArea
                                        value={data.description}
                                        onChange={(value) => setData('description', value)}
                                        error={!!errors.description}
                                        rows={3}
                                        placeholder="Brief description of the product template"
                                    />
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
                                            defaultValue={data.product_type_id}
                                            onChange={(value) => setData('product_type_id', value)}
                                        />
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
                                            defaultValue={data.category_id}
                                            onChange={(value) => setData('category_id', value)}
                                        />
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
                                {data.template_structure.variants.map((variant, variantIndex) => (
                                    <div
                                        key={variantIndex}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-primary-500" />
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    Variant {variantIndex + 1}
                                                </span>
                                            </div>
                                            {data.template_structure.variants.length > 1 && (
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
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Name"
                                                                    value={pkg.name}
                                                                    onChange={(e) =>
                                                                        updatePackagingType(variantIndex, pkgIndex, 'name', e.target.value)
                                                                    }
                                                                />
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Display Name"
                                                                    value={pkg.display_name}
                                                                    onChange={(e) =>
                                                                        updatePackagingType(variantIndex, pkgIndex, 'display_name', e.target.value)
                                                                    }
                                                                />
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Units"
                                                                    value={pkg.units_per_package}
                                                                    onChange={(e) =>
                                                                        updatePackagingType(variantIndex, pkgIndex, 'units_per_package', parseInt(e.target.value) || 1)
                                                                    }
                                                                />
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
                            <InputError message={errors['template_structure.variants']} />
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
                                        checked={data.has_variants}
                                        onChange={(e) => setData('has_variants', e.target.checked)}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Has multiple variants
                                    </span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <Checkbox
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
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
                                {Object.entries(data.custom_attributes).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-900 dark:text-white">{value}</span>
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
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
