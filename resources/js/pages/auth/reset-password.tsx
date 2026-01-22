import NewPasswordController from '@/actions/App/Http/Controllers/Auth/NewPasswordController';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import AuthLayout from '@/layouts/AuthPageLayout.tsx';
import { Form, Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, LoaderCircle, Lock } from 'lucide-react';
import { useState } from 'react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthLayout>
            <Head title="Reset password" />

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
                                <Lock className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                                Set new password
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Your new password must be different from
                                previously used passwords.
                            </p>
                        </div>

                        <Form
                            {...NewPasswordController.store.form()}
                            transform={(data) => ({
                                ...data,
                                token,
                                email,
                            })}
                            resetOnSuccess={[
                                'password',
                                'password_confirmation',
                            ]}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={email}
                                            disabled
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <Label htmlFor="password">
                                            New Password{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                name="password"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div>
                                        <Label htmlFor="password_confirmation">
                                            Confirm Password{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            placeholder="Confirm new password"
                                        />
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing}
                                    >
                                        {processing && (
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {processing
                                            ? 'Resetting...'
                                            : 'Reset password'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </motion.div>
                </div>
            </div>
        </AuthLayout>
    );
}
