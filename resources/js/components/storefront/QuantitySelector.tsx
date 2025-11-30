import React from 'react';
import { Minus, Plus } from 'lucide-react';

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
                className="px-3 py-2 border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Decrease quantity"
            >
                <Minus className="w-4 h-4" />
            </button>

            <input
                type="number"
                value={quantity}
                onChange={handleInputChange}
                min={min}
                max={max}
                disabled={disabled}
                className="w-16 px-3 py-2 border-t border-b border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Quantity"
            />

            <button
                type="button"
                onClick={handleIncrement}
                disabled={disabled || quantity >= max}
                className="px-3 py-2 border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Increase quantity"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
};

export default QuantitySelector;
