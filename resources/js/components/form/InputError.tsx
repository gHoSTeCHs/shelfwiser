import { HTMLAttributes } from 'react';

interface InputErrorProps extends HTMLAttributes<HTMLParagraphElement> {
    message?: string;
}

export default function InputError({
    message,
    className = '',
    ...props
}: InputErrorProps) {
    return message ? (
        <p
            {...props}
            role="alert"
            className={`text-sm text-red-600 dark:text-red-400 ${className}`}
        >
            {message}
        </p>
    ) : null;
}
