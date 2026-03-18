import Input from '@/components/form/input/InputField';
import { RepeaterField } from './RepeaterField';
import type { ConfigFieldSchema } from '../../types/builder';

interface SlideItem {
    heading: string;
    subheading: string;
    image: string | null;
    cta_text: string;
    cta_link: string;
}

interface SlideListFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function SlideListField({ name, schema, value, onChange }: SlideListFieldProps) {
    const items = Array.isArray(value) ? (value as SlideItem[]) : [];

    return (
        <RepeaterField<SlideItem>
            name={name}
            schema={schema}
            items={items}
            onChange={onChange}
            itemLabel="slide"
            maxItems={10}
            createEmpty={() => ({
                heading: '',
                subheading: '',
                image: null,
                cta_text: '',
                cta_link: '',
            })}
            renderItem={(item, _index, onItemChange) => (
                <>
                    <Input
                        type="text"
                        value={item.heading}
                        placeholder="Slide heading"
                        label="Heading"
                        onChange={(e) => onItemChange({ ...item, heading: e.target.value })}
                    />
                    <Input
                        type="text"
                        value={item.subheading}
                        placeholder="Slide subheading"
                        label="Subheading"
                        onChange={(e) => onItemChange({ ...item, subheading: e.target.value })}
                    />
                    <Input
                        type="text"
                        value={item.image ?? ''}
                        placeholder="Image URL"
                        label="Image"
                        onChange={(e) => onItemChange({ ...item, image: e.target.value || null })}
                    />
                    <Input
                        type="text"
                        value={item.cta_text}
                        placeholder="Button text"
                        label="Button Text"
                        onChange={(e) => onItemChange({ ...item, cta_text: e.target.value })}
                    />
                    <Input
                        type="text"
                        value={item.cta_link}
                        placeholder="/products"
                        label="Button Link"
                        onChange={(e) => onItemChange({ ...item, cta_link: e.target.value })}
                    />
                </>
            )}
        />
    );
}
