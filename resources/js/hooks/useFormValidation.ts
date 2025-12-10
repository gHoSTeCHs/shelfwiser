import { useCallback, useState } from 'react';

interface ValidationRules {
    [field: string]: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        custom?: (value: any) => string | null;
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
        (field: string, value: any): string | null => {
            const fieldRules = rules[field];
            if (!fieldRules) return null;

            // Required validation
            if (
                fieldRules.required &&
                (!value || value.toString().trim() === '')
            ) {
                return 'This field is required';
            }

            // Skip other validations if field is empty and not required
            if (!value || value.toString().trim() === '') {
                return null;
            }

            // Min length validation
            if (
                fieldRules.minLength &&
                value.toString().length < fieldRules.minLength
            ) {
                return `Must be at least ${fieldRules.minLength} characters`;
            }

            // Max length validation
            if (
                fieldRules.maxLength &&
                value.toString().length > fieldRules.maxLength
            ) {
                return `Must be no more than ${fieldRules.maxLength} characters`;
            }

            // Pattern validation
            if (
                fieldRules.pattern &&
                !fieldRules.pattern.test(value.toString())
            ) {
                return 'Invalid format';
            }

            // Custom validation
            if (fieldRules.custom) {
                return fieldRules.custom(value);
            }

            return null;
        },
        [rules],
    );

    const validateField = useCallback(
        (field: string, value: any) => {
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
        (formData: Record<string, any>): boolean => {
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
