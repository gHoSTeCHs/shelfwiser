export const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'brand',
        packed: 'blue',
        shipped: 'purple',
        delivered: 'success',
        cancelled: 'error',
        refunded: 'gray',
    };
    return colors[status] || 'gray';
};

export const getPaymentStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        unpaid: 'error',
        partial: 'warning',
        paid: 'success',
        refunded: 'gray',
        failed: 'error',
    };
    return colors[status] || 'gray';
};
