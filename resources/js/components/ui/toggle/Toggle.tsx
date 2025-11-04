import React, { useState } from "react";

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  description?: string;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked: controlledChecked,
  onChange,
  disabled = false,
  size = "md",
  label,
  description,
  className = "",
}) => {
  const [internalChecked, setInternalChecked] = useState(false);

  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;

    const newChecked = !checked;

    if (!isControlled) {
      setInternalChecked(newChecked);
    }

    onChange?.(newChecked);
  };

  const sizeClasses = {
    sm: {
      track: "w-9 h-5",
      thumb: "w-4 h-4",
      translate: checked ? "translate-x-4" : "translate-x-0.5",
    },
    md: {
      track: "w-11 h-6",
      thumb: "w-5 h-5",
      translate: checked ? "translate-x-5" : "translate-x-0.5",
    },
    lg: {
      track: "w-14 h-7",
      thumb: "w-6 h-6",
      translate: checked ? "translate-x-7" : "translate-x-0.5",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={handleToggle}
          className={`
            relative inline-flex ${currentSize.track} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-900
            ${checked
              ? "bg-brand-500"
              : "bg-gray-200 dark:bg-gray-700"
            }
            ${disabled
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-opacity-90"
            }
          `}
        >
          <span
            className={`
              ${currentSize.thumb} inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
              ${currentSize.translate}
            `}
          />
        </button>

        {(label || description) && (
          <div className="ml-3">
            {label && (
              <span className={`text-sm font-medium text-gray-900 dark:text-white ${disabled ? "opacity-50" : ""}`}>
                {label}
              </span>
            )}
            {description && (
              <p className={`text-sm text-gray-500 dark:text-gray-400 ${disabled ? "opacity-50" : ""}`}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Toggle;
