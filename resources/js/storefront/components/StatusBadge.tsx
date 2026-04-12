const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#8b5cf6',
    packed: '#6366f1',
    shipped: '#06b6d4',
    delivered: '#10b981',
    cancelled: '#ef4444',
    refunded: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
    const bg = STATUS_COLORS[status] ?? '#6b7280';
    const label = STATUS_LABELS[status] ?? status;
    const padding = size === 'md' ? '4px 14px' : '2px 10px';
    const fontSize = size === 'md' ? '12px' : '11px';

    return (
        <span
            style={{
                display: 'inline-block',
                padding,
                borderRadius: '999px',
                backgroundColor: bg,
                color: '#fff',
                fontSize,
                fontWeight: 600,
                textTransform: 'capitalize',
            }}
        >
            {label}
        </span>
    );
}
