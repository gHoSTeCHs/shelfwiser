import Select from '@/components/form/Select';
import { formatFieldName } from '../lib/format-field-name';

interface VariantSelectorProps {
    variants: string[];
    currentVariant: string;
    onChange: (variant: string) => void;
    disabled?: boolean;
}

export function VariantSelector({ variants, currentVariant, onChange, disabled }: VariantSelectorProps) {
    if (variants.length === 0) return null;

    const options = variants.map((v) => ({
        value: v,
        label: formatFieldName(v),
    }));

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Layout Variant
            </label>
            <Select
                options={options}
                value={currentVariant}
                onChange={onChange}
                disabled={disabled}
            />
        </div>
    );
}
