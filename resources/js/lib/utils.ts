import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ProductCategory } from '@/types/product.ts';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const flattenCategories = (
    cats: ProductCategory[],
    prefix = '',
): { value: number; label: string }[] => {
    return cats.flatMap((cat) => {
        const option = {
            value: cat.id,
            label: prefix + cat.name,
        };
        const children =
            cat.children && cat.children.length > 0
                ? flattenCategories(cat.children, prefix + '  ')
                : [];
        return [option, ...children];
    });
};

