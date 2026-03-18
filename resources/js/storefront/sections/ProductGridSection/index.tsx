import React from 'react';
import type { SectionProps } from '../../types/storefront';
import { StandardGrid } from './StandardGrid';
import { SidebarFilters } from './SidebarFilters';
import { InfiniteScroll } from './InfiniteScroll';
import { GridListToggle } from './GridListToggle';

const variants: Record<string, React.FC<SectionProps>> = {
    standard_grid: StandardGrid,
    sidebar_filters: SidebarFilters,
    infinite_scroll: InfiniteScroll,
    grid_list_toggle: GridListToggle,
};

export function ProductGridSection(props: SectionProps) {
    const Variant = variants[props.variant] || StandardGrid;
    return <Variant {...props} />;
}
