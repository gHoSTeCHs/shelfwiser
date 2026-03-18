import React from 'react';
import type { SectionProps } from '../../types/storefront';
import { ImageOverlay } from './ImageOverlay';
import { ImageAbove } from './ImageAbove';
import { Chips } from './Chips';
import { IconGrid } from './IconGrid';
import { Carousel } from './Carousel';

const variants: Record<string, React.FC<SectionProps>> = {
    image_overlay: ImageOverlay,
    image_above: ImageAbove,
    chips: Chips,
    icon_grid: IconGrid,
    carousel: Carousel,
};

export function CategoryGridSection(props: SectionProps) {
    const Variant = variants[props.variant] || ImageOverlay;
    return <Variant {...props} />;
}
