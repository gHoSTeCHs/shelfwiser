import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import { RepeaterField } from './RepeaterField';
import type { ConfigFieldSchema } from '../../types/builder';

interface CollectionItem {
    title: string;
    product_source: string;
    category_id: number | null;
    max_items: number;
}

interface CollectionListFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

const SOURCE_OPTIONS = [
    { value: 'auto', label: 'Automatic (by category)' },
    { value: 'featured', label: 'Featured Products' },
    { value: 'newest', label: 'Newest Products' },
    { value: 'bestselling', label: 'Best Selling' },
];

export function CollectionListField({ name, schema, value, onChange }: CollectionListFieldProps) {
    const items = Array.isArray(value) ? (value as CollectionItem[]) : [];

    return (
        <RepeaterField<CollectionItem>
            name={name}
            schema={schema}
            items={items}
            onChange={onChange}
            itemLabel="collection"
            maxItems={10}
            createEmpty={() => ({
                title: '',
                product_source: 'auto',
                category_id: null,
                max_items: 8,
            })}
            renderItem={(item, _index, onItemChange) => (
                <>
                    <Input
                        type="text"
                        value={item.title}
                        placeholder="Collection title"
                        label="Title"
                        onChange={(e) => onItemChange({ ...item, title: e.target.value })}
                    />
                    <Select
                        options={SOURCE_OPTIONS}
                        value={item.product_source}
                        label="Product Source"
                        onChange={(val) => onItemChange({ ...item, product_source: val })}
                    />
                    <Input
                        type="number"
                        value={item.category_id ?? ''}
                        placeholder="Category ID"
                        label="Category ID"
                        onChange={(e) => {
                            const parsed = parseInt(e.target.value);
                            onItemChange({ ...item, category_id: isNaN(parsed) ? null : parsed });
                        }}
                    />
                    <Input
                        type="number"
                        value={item.max_items}
                        placeholder="8"
                        label="Max Items"
                        min={1}
                        max={24}
                        onChange={(e) => {
                            const parsed = parseInt(e.target.value);
                            onItemChange({ ...item, max_items: isNaN(parsed) ? 8 : parsed });
                        }}
                    />
                </>
            )}
        />
    );
}
