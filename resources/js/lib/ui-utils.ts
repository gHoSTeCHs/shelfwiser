import {ShoppingCart} from 'lucide-react'

const getMovementIcon = (type: string) => {
    switch (type) {
        case 'purchase':
            return <ShoppingCart className="h-5 w-5 text-success-500" />;
        case 'sale':
            return <Package className="h-5 w-5 text-blue-500" />;
        case 'adjustment_in':
            return <ArrowUpCircle className="h-5 w-5 text-success-500" />;
        case 'adjustment_out':
            return <ArrowDownCircle className="h-5 w-5 text-warning-500" />;
        case 'transfer_in':
            return (
                <ArrowRightCircle className="h-5 w-5 rotate-180 text-brand-500" />
            );
        case 'transfer_out':
            return <ArrowRightCircle className="h-5 w-5 text-brand-500" />;
        case 'return':
            return <Undo2 className="h-5 w-5 text-blue-500" />;
        case 'damage':
            return <Wrench className="h-5 w-5 text-warning-500" />;
        case 'loss':
            return <Trash2 className="h-5 w-5 text-error-500" />;
        case 'stock_take':
            return <ClipboardCheck className="h-5 w-5 text-purple-500" />;
        default:
            return <Package className="h-5 w-5 text-gray-500" />;
    }
};
