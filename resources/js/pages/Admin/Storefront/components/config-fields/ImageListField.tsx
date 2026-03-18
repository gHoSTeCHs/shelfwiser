import Input from '@/components/form/input/InputField';
import { RepeaterField } from './RepeaterField';
import { formatFieldName } from '../../lib/format-field-name';
import type { ConfigFieldSchema } from '../../types/builder';
import { ImageIcon } from 'lucide-react';

interface ImageItem {
    url: string;
    alt: string;
    caption?: string;
}

interface ImageListFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function ImageListField({ name, schema, value, onChange }: ImageListFieldProps) {
    const items = Array.isArray(value) ? (value as ImageItem[]) : [];

    return (
        <RepeaterField<ImageItem>
            name={name}
            schema={schema}
            items={items}
            onChange={onChange}
            itemLabel="image"
            maxItems={20}
            createEmpty={() => ({ url: '', alt: '', caption: '' })}
            renderItem={(item, _index, onItemChange) => (
                <>
                    {item.url ? (
                        <img
                            src={item.url}
                            alt={item.alt}
                            className="h-16 w-full rounded object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="flex h-16 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                    )}
                    <Input
                        type="text"
                        value={item.url}
                        placeholder="Image URL"
                        label="URL"
                        onChange={(e) => onItemChange({ ...item, url: e.target.value })}
                    />
                    <Input
                        type="text"
                        value={item.alt}
                        placeholder="Alt text"
                        label="Alt Text"
                        onChange={(e) => onItemChange({ ...item, alt: e.target.value })}
                    />
                </>
            )}
        />
    );
}
