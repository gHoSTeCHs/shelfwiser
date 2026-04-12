export function buttonRadius(): string {
    return 'var(--button-radius, rounded)';
}

export function resolveButtonRadius(value?: string): string {
    switch (value ?? 'rounded') {
        case 'pill': return '999px';
        case 'sharp': return 'calc(var(--radius, 8px) * 0.5)';
        case 'rounded':
        default: return 'var(--radius, 8px)';
    }
}

export function resolveImageRadius(value?: string): string {
    switch (value ?? 'soft') {
        case 'sharp': return 'calc(var(--radius, 8px) * 0.5)';
        case 'rounded': return 'calc(var(--radius, 8px) * 2)';
        case 'soft':
        default: return 'var(--radius, 8px)';
    }
}

export function resolveCardBorder(value?: string): string {
    switch (value ?? 'subtle') {
        case 'visible': return '1px solid var(--color-border, #e5e7eb)';
        case 'none': return '1px solid transparent';
        case 'subtle':
        default: return '1px solid color-mix(in srgb, var(--color-border, #e5e7eb) 60%, transparent)';
    }
}

export function resolveHeadingTransform(value?: string): string {
    return value === 'uppercase' ? 'uppercase' : 'none';
}

export function resolveDividerStyle(value?: string): React.CSSProperties | null {
    switch (value) {
        case 'line':
            return {
                height: 1,
                backgroundColor: 'var(--color-border, #e5e7eb)',
                margin: '0 auto',
                maxWidth: 'var(--container-width, 1280px)',
            };
        case 'dots':
            return {
                height: 2,
                backgroundImage: 'radial-gradient(circle, var(--color-border, #d1d5db) 1px, transparent 1px)',
                backgroundSize: '12px 2px',
                margin: '0 auto',
                maxWidth: 'var(--container-width, 1280px)',
            };
        default:
            return null;
    }
}
