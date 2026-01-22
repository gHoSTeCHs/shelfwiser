import { Minus, Plus } from 'lucide-react';
import React from 'react';

interface QuantitySelectorProps {
    quantity: number;
    onChange: (quantity: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
    className?: string;
}

/**
 * Number input with increment/decrement buttons for quantity selection.
 * Includes min/max validation and stock availability checking.
 */
const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    quantity,
    onChange,
    min = 1,
    max = 9999,
    disabled = false,
    className = '',
}) => {
    const handleIncrement = () => {
        if (quantity < max && !disabled) {
            onChange(quantity + 1);
        }
    };

    const handleDecrement = () => {
        if (quantity > min && !disabled) {
            onChange(quantity - 1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= min && value <= max) {
            onChange(value);
        }
    };

    return (
        <div className={`flex items-center ${className}`}>
            <button
                type="button"
                onClick={handleDecrement}
                disabled={disabled || quantity <= min}
                className="rounded-l-md border border-gray-300 px-3 py-2 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Decrease quantity"
            >
                <Minus className="h-4 w-4" />
            </button>

            <input
                type="number"
                value={quantity}
                onChange={handleInputChange}
                min={min}
                max={max}
                disabled={disabled}
                className="w-16 border-t border-b border-gray-300 px-3 py-2 text-center focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Quantity"
            />

            <button
                type="button"
                onClick={handleIncrement}
                disabled={disabled || quantity >= max}
                className="rounded-r-md border border-gray-300 px-3 py-2 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Increase quantity"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
};

export default QuantitySelector;
