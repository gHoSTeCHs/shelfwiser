import type { LayoutProps } from '../types/storefront';
import { ClassicCommerceLayout } from './ClassicCommerceLayout';

export const templateLayoutRegistry: Record<string, React.FC<LayoutProps>> = {
    'classic-commerce': ClassicCommerceLayout,
};
