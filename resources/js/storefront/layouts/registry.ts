import type { FC } from 'react';
import type { LayoutProps } from '../types/storefront';
import { ClassicCommerceLayout } from './ClassicCommerceLayout';

export const templateLayoutRegistry: Record<string, FC<LayoutProps>> = {
    'classic-commerce': ClassicCommerceLayout,
};
