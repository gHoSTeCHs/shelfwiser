import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Select from '@/components/form/Select';
import { RepeaterField } from './RepeaterField';
import type { ConfigFieldSchema } from '../../types/builder';

interface TestimonialItem {
    name: string;
    text: string;
    rating: number;
    avatar_path: string | null;
    location: string;
}

interface TestimonialListFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
    value: String(n),
    label: `${n} Star${n > 1 ? 's' : ''}`,
}));

export function TestimonialListField({ name, schema, value, onChange }: TestimonialListFieldProps) {
    const items = Array.isArray(value) ? (value as TestimonialItem[]) : [];

    return (
        <RepeaterField<TestimonialItem>
            name={name}
            schema={schema}
            items={items}
            onChange={onChange}
            itemLabel="testimonial"
            maxItems={10}
            createEmpty={() => ({
                name: '',
                text: '',
                rating: 5,
                avatar_path: null,
                location: '',
            })}
            renderItem={(item, _index, onItemChange) => (
                <>
                    <Input
                        type="text"
                        value={item.name}
                        placeholder="Customer name"
                        label="Name"
                        onChange={(e) => onItemChange({ ...item, name: e.target.value })}
                    />
                    <TextArea
                        value={item.text}
                        placeholder="Testimonial text..."
                        rows={3}
                        label="Testimonial"
                        onChange={(val) => onItemChange({ ...item, text: val })}
                    />
                    <Select
                        options={RATING_OPTIONS}
                        value={String(item.rating)}
                        label="Rating"
                        onChange={(val) => onItemChange({ ...item, rating: parseInt(val) || 5 })}
                    />
                    <Input
                        type="text"
                        value={item.location}
                        placeholder="Lagos, Nigeria"
                        label="Location"
                        onChange={(e) => onItemChange({ ...item, location: e.target.value })}
                    />
                    <Input
                        type="text"
                        value={item.avatar_path ?? ''}
                        placeholder="Avatar image URL"
                        label="Avatar"
                        onChange={(e) => onItemChange({ ...item, avatar_path: e.target.value || null })}
                    />
                </>
            )}
        />
    );
}
