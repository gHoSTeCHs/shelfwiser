import { SchemaProperty } from '@/types';
import { ProductCategory } from '@/types/product.ts';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

/**
 * Transform config data based on JSON schema properties.
 * Converts string values to their proper types (integer, number, boolean) based on schema.
 *
 * @param data - The form data containing config object
 * @param schemaProperties - The JSON schema properties defining field types
 * @returns Transformed data with config values properly typed
 *
 * @example
 * ```tsx
 * <Form
 *     action={ShopController.store.url()}
 *     method="post"
 *     transform={(data) => transformConfigBySchema(data, selectedType?.config_schema?.properties)}
 * >
 * ```
 */
export const transformConfigBySchema = <T extends Record<string, any>>(
    data: T,
    schemaProperties?: Record<string, SchemaProperty>,
): T => {
    if (!schemaProperties || !data.config) {
        return data;
    }

    const transformedConfig: Record<string, any> = {};

    Object.entries(data.config).forEach(([key, value]) => {
        const schema = schemaProperties[key] as SchemaProperty | undefined;

        if (schema) {
            if (schema.type === 'integer') {
                transformedConfig[key] = parseInt(value as string);
            } else if (schema.type === 'number') {
                transformedConfig[key] = parseFloat(value as string);
            } else if (schema.type === 'boolean') {
                transformedConfig[key] = value === 'true' || value === true;
            } else {
                transformedConfig[key] = value;
            }
        } else {
            transformedConfig[key] = value;
        }
    });

    return {
        ...data,
        config: transformedConfig,
    };
};


export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
