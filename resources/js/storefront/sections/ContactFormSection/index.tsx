import type { SectionProps } from '../../types/storefront';
import { SplitLayout } from './SplitLayout';
import { Standard } from './Standard';

const variants: Record<string, React.FC<SectionProps>> = {
    standard: Standard,
    split_layout: SplitLayout,
};

export function ContactFormSection(props: SectionProps) {
    const Variant = variants[props.variant] || Standard;

    return <Variant {...props} />;
}
