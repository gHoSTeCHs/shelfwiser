import React from 'react';

interface TextareaProps {
    id?: string;
    name?: string;
    placeholder?: string;
    rows?: number;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
    disabled?: boolean;
    error?: boolean;
    hint?: string;
    ariaLabel?: string;
    label?: string;
    required?: boolean;
}

const TextArea: React.FC<TextareaProps> = ({
    id = '',
    name = '',
    placeholder = 'Enter your message',
    rows = 3,
    value = '',
    onChange,
    className = '',
    disabled = false,
    error = false,
    hint = '',
    ariaLabel,
    label,
    required = false,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden ${className} `;

    if (disabled) {
        textareaClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed opacity40 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    } else if (error) {
        textareaClasses += ` bg-transparent  border-gray-300 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-error-800`;
    } else {
        textareaClasses += ` bg-transparent text-gray-900 dark:text-gray-300 text-gray-900 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
    }

    const errorId = error && id ? `${id}-error` : undefined;
    const hintId = hint && id ? `${id}-hint` : undefined;

    return (
        <div className="relative">
            <textarea
                name={name}
                id={id}
                placeholder={placeholder}
                rows={rows}
                value={value}
                onChange={handleChange}
                disabled={disabled}
                required={required}
                className={textareaClasses}
                aria-label={ariaLabel || label}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId || hintId}
            />
            {hint && (
                <p
                    id={hintId}
                    role={error ? 'alert' : undefined}
                    className={`mt-2 text-sm ${
                        error
                            ? 'text-error-500'
                            : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                    {hint}
                </p>
            )}
        </div>
    );
};

export default TextArea;
