import { useCallback, useState } from 'react';

interface ValidationRules {
    [field: string]: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        custom?: (value: unknown) => string | null;
    };
}

interface ValidationErrors {
    [field: string]: string | null;
}

/**
 * Custom hook for client-side form validation
 * Provides real-time validation feedback before server submission
 */
export function useFormValidation(rules: ValidationRules) {
    const [errors, setErrors] = useState<ValidationErrors>({});

    const validate = useCallback(
        (field: string, value: unknown): string | null => {
            const fieldRules = rules[field];
            if (!fieldRules) return null;

            const stringValue = value?.toString() ?? '';

            if (fieldRules.required && stringValue.trim() === '') {
                return 'This field is required';
            }

            if (stringValue.trim() === '') {
                return null;
            }

            if (
                fieldRules.minLength &&
                stringValue.length < fieldRules.minLength
            ) {
                return `Must be at least ${fieldRules.minLength} characters`;
            }

            if (
                fieldRules.maxLength &&
                stringValue.length > fieldRules.maxLength
            ) {
                return `Must be no more than ${fieldRules.maxLength} characters`;
            }

            if (
                fieldRules.pattern &&
                !fieldRules.pattern.test(stringValue)
            ) {
                return 'Invalid format';
            }

            if (fieldRules.custom) {
                return fieldRules.custom(value);
            }

            return null;
        },
        [rules],
    );

    const validateField = useCallback(
        (field: string, value: unknown) => {
            const error = validate(field, value);
            setErrors((prev) => ({
                ...prev,
                [field]: error,
            }));
            return error === null;
        },
        [validate],
    );

    const validateAll = useCallback(
        (formData: Record<string, unknown>): boolean => {
            const newErrors: ValidationErrors = {};
            let isValid = true;

            Object.keys(rules).forEach((field) => {
                const error = validate(field, formData[field]);
                newErrors[field] = error;
                if (error) isValid = false;
            });

            setErrors(newErrors);
            return isValid;
        },
        [rules, validate],
    );

    const clearError = useCallback((field: string) => {
        setErrors((prev) => ({
            ...prev,
            [field]: null,
        }));
    }, []);

    const clearAll = useCallback(() => {
        setErrors({});
    }, []);

    return {
        errors,
        validateField,
        validateAll,
        clearError,
        clearAll,
    };
}
