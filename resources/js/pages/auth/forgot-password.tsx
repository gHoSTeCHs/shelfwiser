import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import TextLink from '@/components/text-link';
import Button from '@/components/ui/button/Button';
import AuthLayout from '@/layouts/AuthPageLayout.tsx';
import { login } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, LoaderCircle, Mail } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout>
            <Head title="Forgot password" />

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
                                <Mail className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                                Forgot password?
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No worries, we'll send you reset instructions.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-4 rounded-xl bg-success-50 p-4 text-center text-sm font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
                                {status}
                            </div>
                        )}

                        <Form
                            {...PasswordResetLinkController.store.form()}
                            className="space-y-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <Label htmlFor="email">
                                            Email{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                        />
                                        <InputError message={errors.email} />
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
                                            ? 'Sending...'
                                            : 'Send reset link'}
                                    </Button>

                                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                        Remember your password?{' '}
                                        <TextLink href={login.url()}>
                                            Sign in
                                        </TextLink>
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
