import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import { login } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { ChevronLeftIcon } from '../../icons';

import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import TextLink from '@/components/text-link';
import Button from '@/components/ui/button/Button';
import AuthLayout from '@/layouts/AuthPageLayout.tsx';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout>
            <Head title="Forgot password" />

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
                                Forgot password
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Enter your email to receive a password reset
                                link
                            </p>
                        </div>

                        {status && (
                            <div className="mb-4 text-center text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        <div>
                            <Form
                                {...PasswordResetLinkController.store.form()}
                                className="space-y-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div>
                                            <Label htmlFor="email">
                                                Email address{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                placeholder="email@example.com"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <div>
                                            <Button
                                                className="w-full"
                                                size="sm"
                                                type="submit"
                                                disabled={processing}
                                            >
                                                {processing && (
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                )}
                                                {processing
                                                    ? 'Sending...'
                                                    : 'Email password reset link'}
                                            </Button>
                                        </div>

                                        <div className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                                            Or, return to{' '}
                                            <TextLink href={login.url()}>
                                                log in
                                            </TextLink>
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
