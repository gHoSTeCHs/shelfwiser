import React from 'react';
import type { SectionProps } from '../../types/storefront';
import { CenteredOverlay } from './CenteredOverlay';
import { SplitImage } from './SplitImage';
import { Slideshow } from './Slideshow';
import { MinimalText } from './MinimalText';
import { VideoBackground } from './VideoBackground';
import { Asymmetric } from './Asymmetric';

const variants: Record<string, React.FC<SectionProps>> = {
    centered_overlay: CenteredOverlay,
    split_image: SplitImage,
    slideshow: Slideshow,
    minimal_text: MinimalText,
    video_background: VideoBackground,
    asymmetric: Asymmetric,
};

export function HeroBannerSection(props: SectionProps) {
    const Variant = variants[props.variant] || CenteredOverlay;
    return <Variant {...props} />;
}
