import React from 'react';

interface RadioProps {
    id: string;
    name: string;
    value: string;
    checked: boolean;
    label: string;
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
    error?: boolean;
    ariaLabel?: string;
}

const Radio: React.FC<RadioProps> = ({
    id,
    name,
    value,
    checked,
    label,
    onChange,
    className = '',
    disabled = false,
    error = false,
    ariaLabel,
}) => {
    return (
        <label
            htmlFor={id}
            className={`relative flex cursor-pointer items-center gap-3 text-sm font-medium select-none ${
                disabled
                    ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                    : 'text-gray-700 dark:text-gray-400'
            } ${className}`}
        >
            <input
                id={id}
                name={name}
                type="radio"
                value={value}
                checked={checked}
                onChange={() => !disabled && onChange(value)}
                className="sr-only"
                disabled={disabled}
                aria-label={ariaLabel || label}
                aria-invalid={error ? true : undefined}
            />
            <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.25px] ${
                    checked
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-gray-300 bg-transparent dark:border-gray-700'
                } ${
                    disabled
                        ? 'border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700'
                        : ''
                }`}
            >
                <span
                    className={`h-2 w-2 rounded-full bg-white ${
                        checked ? 'block' : 'hidden'
                    }`}
                ></span>
            </span>
            {label}
        </label>
    );
};

export default Radio;
