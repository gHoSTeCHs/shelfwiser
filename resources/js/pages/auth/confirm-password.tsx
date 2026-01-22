import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import AuthLayout from '@/layouts/AuthPageLayout.tsx';
import { store } from '@/routes/password/confirm';
import { Form, Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Eye,
    EyeOff,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthLayout>
            <Head title="Confirm password" />

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
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 dark:bg-warning-500/20">
                                <ShieldCheck className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                            </div>
                            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                                Confirm your password
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This is a secure area. Please confirm your
                                password to continue.
                            </p>
                        </div>

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <Label htmlFor="password">
                                            Password{' '}
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
                                                placeholder="Enter your password"
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

                                    <Button
                                        className="w-full"
                                        type="submit"
                                        disabled={processing}
                                    >
                                        {processing && (
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {processing
                                            ? 'Confirming...'
                                            : 'Confirm'}
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
