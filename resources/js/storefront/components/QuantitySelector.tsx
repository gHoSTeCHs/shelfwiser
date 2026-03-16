interface QuantitySelectorProps {
    value: number;
    min?: number;
    max?: number | null;
    onChange: (quantity: number) => void;
    disabled?: boolean;
}

export function QuantitySelector({ value, min = 1, max, onChange, disabled = false }: QuantitySelectorProps) {
    const canDecrement = value > min;
    const canIncrement = max === null || max === undefined || value < max;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <button
                type="button"
                onClick={() => canDecrement && onChange(value - 1)}
                disabled={disabled || !canDecrement}
                aria-label="Decrease quantity"
                style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: 'var(--radius, 6px) 0 0 var(--radius, 6px)',
                    backgroundColor: 'var(--color-surface, #fff)',
                    color: 'var(--color-foreground, #111)',
                    cursor: canDecrement && !disabled ? 'pointer' : 'not-allowed',
                    opacity: canDecrement && !disabled ? 1 : 0.4,
                    fontSize: '16px',
                    lineHeight: 1,
                }}
            >
                &minus;
            </button>
            <span
                style={{
                    width: '40px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTop: '1px solid var(--color-border, #e5e7eb)',
                    borderBottom: '1px solid var(--color-border, #e5e7eb)',
                    backgroundColor: 'var(--color-surface, #fff)',
                    color: 'var(--color-foreground, #111)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 500,
                }}
            >
                {value}
            </span>
            <button
                type="button"
                onClick={() => canIncrement && onChange(value + 1)}
                disabled={disabled || !canIncrement}
                aria-label="Increase quantity"
                style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '0 var(--radius, 6px) var(--radius, 6px) 0',
                    backgroundColor: 'var(--color-surface, #fff)',
                    color: 'var(--color-foreground, #111)',
                    cursor: canIncrement && !disabled ? 'pointer' : 'not-allowed',
                    opacity: canIncrement && !disabled ? 1 : 0.4,
                    fontSize: '16px',
                    lineHeight: 1,
                }}
            >
                +
            </button>
        </div>
    );
}
