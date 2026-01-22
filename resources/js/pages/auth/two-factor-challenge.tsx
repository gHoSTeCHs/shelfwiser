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
import { motion } from 'framer-motion';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ArrowLeft, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';

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
                description: 'Enter one of your emergency recovery codes.',
                toggleText: 'Use authentication code instead',
            };
        }

        return {
            title: 'Two-Factor Authentication',
            description: 'Enter the 6-digit code from your authenticator app.',
            toggleText: 'Use recovery code instead',
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
                <div className="mx-auto w-full max-w-md pt-4 sm:pt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="mb-6 sm:mb-8">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20">
                                <Shield className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                                {authConfigContent.title}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {authConfigContent.description}
                            </p>
                        </div>

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
                                            />
                                            <InputError
                                                message={errors.recovery_code}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <InputOTP
                                                name="code"
                                                maxLength={OTP_MAX_LENGTH}
                                                value={code}
                                                onChange={(value) =>
                                                    setCode(value)
                                                }
                                                disabled={processing}
                                                pattern={REGEXP_ONLY_DIGITS}
                                            >
                                                <InputOTPGroup>
                                                    {Array.from(
                                                        {
                                                            length: OTP_MAX_LENGTH,
                                                        },
                                                        (_, index) => (
                                                            <InputOTPSlot
                                                                key={index}
                                                                index={index}
                                                            />
                                                        ),
                                                    )}
                                                </InputOTPGroup>
                                            </InputOTP>
                                            <InputError message={errors.code} />
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing ? 'Verifying...' : 'Verify'}
                                    </Button>

                                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                        <button
                                            type="button"
                                            className="text-brand-600 underline-offset-4 hover:underline dark:text-brand-400"
                                            onClick={() =>
                                                toggleRecoveryMode(clearErrors)
                                            }
                                        >
                                            {authConfigContent.toggleText}
                                        </button>
                                    </p>
                                </>
                            )}
                        </Form>
                    </motion.div>
                </div>
            </div>
        </AuthLayout>
    );
}
