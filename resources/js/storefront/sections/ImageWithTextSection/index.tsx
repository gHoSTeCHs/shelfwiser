import type React from 'react';
import type { SectionProps } from '../../types/storefront';
import { ImageAbove } from './ImageAbove';
import { ImageLeft } from './ImageLeft';
import { ImageRight } from './ImageRight';

const variants: Record<string, React.FC<SectionProps>> = {
    image_left: ImageLeft,
    image_right: ImageRight,
    image_above: ImageAbove,
};

export function ImageWithTextSection(props: SectionProps) {
    const variantKey = props.variant || (props.config.image_position as string) || 'image_left';
    const Variant = variants[variantKey] || ImageLeft;

    return <Variant {...props} />;
}
