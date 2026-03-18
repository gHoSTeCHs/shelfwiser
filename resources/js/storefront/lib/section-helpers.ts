/**
 * Type-narrowing helpers for section component props.
 *
 * Section components receive `config` and `data` as generic
 * Record<string, unknown> types from the renderer. These helpers
 * provide a single place for the type assertion, replacing the
 * scattered `as unknown as` casts throughout section components.
 */

export function narrowConfig<T>(config: Record<string, unknown>): T {
    return config as T;
}

export function narrowData<T>(data: Record<string, unknown> | unknown[]): T {
    return data as T;
}
