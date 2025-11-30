import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Button from '@/components/ui/button/Button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import AuthLayout from '@/layouts/AuthPageLayout.tsx';
import { store } from '@/routes/two-factor/login';
import { Form, Head, Link } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import { ChevronLeftIcon } from '../../icons';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery Code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                toggleText: 'login using an authentication code',
            };
        }

        return {
            title: 'Authentication Code',
            description:
                'Enter the authentication code provided by your authenticator application.',
            toggleText: 'login using a recovery code',
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <AuthLayout>
            <Head title="Two-Factor Authentication" />

            <div className="flex flex-1 flex-col">
                <div className="mx-auto w-full max-w-md pt-10">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ChevronLeftIcon className="size-5" />
                        Back to Home
                    </Link>
                </div>
                <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
                    <div>
                        <div className="mb-5 sm:mb-8">
                            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
                                {authConfigContent.title}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {authConfigContent.description}
                            </p>
                        </div>

                        <div>
                            <Form
                                {...store.form()}
                                className="space-y-6"
                                resetOnError
                                resetOnSuccess={!showRecoveryInput}
                            >
                                {({ errors, processing, clearErrors }) => (
                                    <>
                                        {showRecoveryInput ? (
                                            <div>
                                                <Input
                                                    name="recovery_code"
                                                    type="text"
                                                    placeholder="Enter recovery code"
                                                    // autoFocus={showRecoveryInput}
                                                />
                                                <InputError
                                                    message={
                                                        errors.recovery_code
                                                    }
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                                <div className="flex w-full items-center justify-center">
                                                    <InputOTP
                                                        name="code"
                                                        maxLength={
                                                            OTP_MAX_LENGTH
                                                        }
                                                        value={code}
                                                        onChange={(value) =>
                                                            setCode(value)
                                                        }
                                                        disabled={processing}
                                                        pattern={
                                                            REGEXP_ONLY_DIGITS
                                                        }
                                                    >
                                                        <InputOTPGroup>
                                                            {Array.from(
                                                                {
                                                                    length: OTP_MAX_LENGTH,
                                                                },
                                                                (_, index) => (
                                                                    <InputOTPSlot
                                                                        key={
                                                                            index
                                                                        }
                                                                        index={
                                                                            index
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                </div>
                                                <InputError
                                                    message={errors.code}
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                size="sm"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Verifying...'
                                                    : 'Continue'}
                                            </Button>
                                        </div>

                                        <div className="text-center text-sm font-normal text-gray-700 dark:text-gray-400">
                                            or you can{' '}
                                            <button
                                                type="button"
                                                className="text-brand-600 decoration-brand-300 dark:text-brand-400 dark:decoration-brand-500 cursor-pointer underline underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current"
                                                onClick={() =>
                                                    toggleRecoveryMode(
                                                        clearErrors,
                                                    )
                                                }
                                            >
                                                {authConfigContent.toggleText}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
