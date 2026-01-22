import React, { useState } from 'react';

interface CheckboxProps {
    label?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    className?: string;
    id?: string;
    name?: string;
    tabIndex?: number;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    error?: boolean;
    ariaLabel?: string;
}

/**
 * Checkbox component supporting both controlled and uncontrolled modes.
 * - Controlled: pass `checked` and `onChange`
 * - Uncontrolled: pass `defaultChecked` (for use with Form component)
 */
const Checkbox: React.FC<CheckboxProps> = ({
    label,
    checked,
    defaultChecked,
    id,
    name,
    tabIndex,
    onChange,
    className = '',
    disabled = false,
    error = false,
    ariaLabel,
}) => {
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
    const isChecked = isControlled ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = e.target.checked;
        if (!isControlled) {
            setInternalChecked(newChecked);
        }
        onChange?.(newChecked);
    };

    return (
        <label
            className={`group flex cursor-pointer items-center space-x-3 ${
                disabled ? 'cursor-not-allowed opacity-60' : ''
            }`}
        >
            <div className="relative h-5 w-5">
                <input
                    id={id}
                    name={name}
                    tabIndex={tabIndex}
                    type="checkbox"
                    className={`h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:border-transparent checked:bg-brand-500 disabled:opacity-60 dark:border-gray-700 ${className}`}
                    checked={isChecked}
                    onChange={handleChange}
                    disabled={disabled}
                    aria-label={ariaLabel || label}
                    aria-invalid={error ? true : undefined}
                />
                {isChecked && (
                    <svg
                        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                    >
                        <path
                            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                            stroke="white"
                            strokeWidth="1.94437"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
                {disabled && (
                    <svg
                        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                    >
                        <path
                            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                            stroke="#E4E7EC"
                            strokeWidth="2.33333"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </div>
            {label && (
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {label}
                </span>
            )}
        </label>
    );
};

export default Checkbox;
