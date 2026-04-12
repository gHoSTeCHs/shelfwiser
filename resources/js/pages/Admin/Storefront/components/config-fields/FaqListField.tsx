import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import { RepeaterField } from './RepeaterField';
import type { ConfigFieldSchema } from '../../types/builder';

interface FaqItem {
    question: string;
    answer: string;
}

interface FaqListFieldProps {
    name: string;
    schema: ConfigFieldSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function FaqListField({ name, schema, value, onChange }: FaqListFieldProps) {
    const items = Array.isArray(value) ? (value as FaqItem[]) : [];

    return (
        <RepeaterField<FaqItem>
            name={name}
            schema={schema}
            items={items}
            onChange={onChange}
            itemLabel="question"
            maxItems={20}
            createEmpty={() => ({
                question: '',
                answer: '',
            })}
            renderItem={(item, _index, onItemChange) => (
                <>
                    <Input
                        type="text"
                        value={item.question}
                        placeholder="What is your return policy?"
                        label="Question"
                        onChange={(e) => onItemChange({ ...item, question: e.target.value })}
                    />
                    <TextArea
                        value={item.answer}
                        placeholder="Answer text..."
                        rows={3}
                        label="Answer"
                        onChange={(val) => onItemChange({ ...item, answer: val })}
                    />
                </>
            )}
        />
    );
}
