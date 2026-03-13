import type { SectionProps } from '../../types/storefront';
import { Cards } from './Cards';
import { Quotes } from './Quotes';
import { Slider } from './Slider';

const variants: Record<string, React.FC<SectionProps>> = {
    cards: Cards,
    slider: Slider,
    quotes: Quotes,
};

export function TestimonialsSection(props: SectionProps) {
    const Variant = variants[props.variant] || Cards;

    return <Variant {...props} />;
}
