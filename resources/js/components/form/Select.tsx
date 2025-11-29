import { ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Option {
    value: string;
    label: string;
}

interface SelectProps {
    name?: string;
    options: Option[];
    placeholder?: string;
    onChange: (value: string) => void;
    className?: string;
    defaultValue?: string;
    value?: string;
    disabled?: boolean;
    error?: boolean;
    success?: boolean;
    allowClear?: boolean;
}

const Select: React.FC<SelectProps> = ({
    name = '',
    options,
    placeholder = 'Select an option',
    onChange,
    className = '',
    defaultValue = '',
    value: controlledValue,
    disabled = false,
    error = false,
    success = false,
    allowClear = false,
}) => {
    const [selectedValue, setSelectedValue] = useState<string>(
        controlledValue ?? defaultValue,
    );

    useEffect(() => {
        if (controlledValue !== undefined) {
            setSelectedValue(controlledValue);
        }
    }, [controlledValue]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        if (controlledValue === undefined) {
            setSelectedValue(value);
        }

        onChange(value);
    };

    const currentValue = controlledValue ?? selectedValue;

    let selectClasses = `h-11 w-full appearance-none rounded-lg border bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:ring-3 focus:outline-hidden dark:bg-gray-900 ${className}`;

    if (disabled) {
        selectClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    } else if (error) {
        selectClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
    } else if (success) {
        selectClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
    } else {
        selectClasses += ` border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800`;
    }

    selectClasses += currentValue
        ? ' text-gray-800 dark:text-white/90'
        : ' text-gray-400 dark:text-gray-400';

    return (
        <div className="relative">
            <select
                className={selectClasses}
                name={name}
                value={currentValue}
                onChange={handleChange}
                disabled={disabled}
            >
                <option
                    value=""
                    disabled={!allowClear}
                    className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                >
                    {placeholder}
                </option>

                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
                    >
                        {option.label}
                    </option>
                ))}
            </select>

            <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
        </div>
    );
};

export default Select;
