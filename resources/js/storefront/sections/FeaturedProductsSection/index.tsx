import React from 'react';
import type { SectionProps } from '../../types/storefront';
import { StandardGrid } from './StandardGrid';
import { SpotlightPlusGrid } from './SpotlightPlusGrid';
import { HorizontalScroll } from './HorizontalScroll';
import { Carousel } from './Carousel';
import { Masonry } from './Masonry';

const variants: Record<string, React.FC<SectionProps>> = {
    standard_grid: StandardGrid,
    spotlight_plus_grid: SpotlightPlusGrid,
    horizontal_scroll: HorizontalScroll,
    carousel: Carousel,
    masonry: Masonry,
};

export function FeaturedProductsSection(props: SectionProps) {
    const Variant = variants[props.variant] || StandardGrid;
    return <Variant {...props} />;
}
