import React from 'react';
import type { SectionProps } from '../../types/storefront';
import { StandardGrid } from './StandardGrid';
import { SidebarFilters } from './SidebarFilters';

const variants: Record<string, React.FC<SectionProps>> = {
    standard_grid: StandardGrid,
    sidebar_filters: SidebarFilters,
};

export function ProductGridSection(props: SectionProps) {
    const Variant = variants[props.variant] || StandardGrid;
    return <Variant {...props} />;
}
