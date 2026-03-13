import type React from 'react';
import type { SectionProps } from '../../types/storefront';
import { SplitLayout } from './SplitLayout';
import { Standard } from './Standard';

const variants: Record<string, React.FC<SectionProps>> = {
    stacked: Standard,
    form_only: Standard,
    side_by_side: SplitLayout,
    card_grid: Standard,
};

export function ContactFormSection(props: SectionProps) {
    const Variant = variants[props.variant] || Standard;

    return <Variant {...props} />;
}
