import type { FC } from 'react';
import type { SectionProps } from '../../types/storefront';
import { Cards } from './Cards';
import { Quotes } from './Quotes';
import { Slider } from './Slider';

const variants: Record<string, FC<SectionProps>> = {
    grid: Cards,
    carousel: Slider,
    single_spotlight: Quotes,
    masonry: Cards,
    marquee: Slider,
};

export function TestimonialsSection(props: SectionProps) {
    const Variant = variants[props.variant] || Cards;

    return <Variant {...props} />;
}
