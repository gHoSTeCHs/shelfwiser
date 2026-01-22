import { useState } from 'react';

interface SwitchProps {
    label: string;
    defaultChecked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
    color?: 'blue' | 'gray';
    error?: boolean;
    ariaLabel?: string;
    id?: string;
}

const Switch: React.FC<SwitchProps> = ({
    label,
    defaultChecked = false,
    disabled = false,
    onChange,
    color = 'blue',
    error = false,
    ariaLabel,
    id,
}) => {
    const [isChecked, setIsChecked] = useState(defaultChecked);

    const handleToggle = () => {
        if (disabled) return;
        const newCheckedState = !isChecked;
        setIsChecked(newCheckedState);
        if (onChange) {
            onChange(newCheckedState);
        }
    };

    const switchColors =
        color === 'blue'
            ? {
                  background: isChecked
                      ? 'bg-brand-500 '
                      : 'bg-gray-200 dark:bg-white/10', // Blue version
                  knob: isChecked
                      ? 'translate-x-full bg-white'
                      : 'translate-x-0 bg-white',
              }
            : {
                  background: isChecked
                      ? 'bg-gray-800 dark:bg-white/10'
                      : 'bg-gray-200 dark:bg-white/10', // Gray version
                  knob: isChecked
                      ? 'translate-x-full bg-white'
                      : 'translate-x-0 bg-white',
              };

    return (
        <label
            htmlFor={id}
            className={`flex cursor-pointer items-center gap-3 text-sm font-medium select-none ${
                disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-400'
            }`}
        >
            <div className="relative">
                <input
                    id={id}
                    type="checkbox"
                    checked={isChecked}
                    onChange={handleToggle}
                    disabled={disabled}
                    className="sr-only"
                    aria-label={ariaLabel || label}
                    aria-invalid={error ? true : undefined}
                />
                <div
                    className={`block h-6 w-11 rounded-full transition duration-150 ease-linear ${
                        disabled
                            ? 'pointer-events-none bg-gray-100 dark:bg-gray-800'
                            : switchColors.background
                    }`}
                    onClick={handleToggle}
                ></div>
                <div
                    className={`absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full shadow-theme-sm duration-150 ease-linear ${switchColors.knob}`}
                ></div>
            </div>
            {label}
        </label>
    );
};

export default Switch;
