import type React from 'react';
import type { SectionProps } from '../../types/storefront';
import { ImageAbove } from './ImageAbove';
import { ImageLeft } from './ImageLeft';
import { ImageRight } from './ImageRight';

const variants: Record<string, React.FC<SectionProps>> = {
    side_by_side: ImageLeft,
    overlap: ImageRight,
    stacked: ImageAbove,
    text_wrap: ImageLeft,
};

export function ImageWithTextSection(props: SectionProps) {
    const position = props.config.image_position as string | undefined;
    const variantKey = props.variant || 'side_by_side';
    let Variant = variants[variantKey] || ImageLeft;

    if (variantKey === 'side_by_side' && position === 'right') {
        Variant = ImageRight;
    }

    return <Variant {...props} />;
}
