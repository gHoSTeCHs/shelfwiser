import NewPasswordController from '@/actions/App/Http/Controllers/Auth/NewPasswordController';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { ChevronLeftIcon } from '../../icons';

import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import AuthLayout from '@/layouts/AuthPageLayout.tsx';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <AuthLayout>
            <Head title="Reset password" />

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
                                Reset password
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Please enter your new password below
                            </p>
                        </div>

                        <div>
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
                                className="space-y-6"
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
                                                value={email}
                                                // readOnly
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="password">
                                                Password{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                placeholder="Password"
                                                // autoFocus
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="password_confirmation">
                                                Confirm password{' '}
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                name="password_confirmation"
                                                placeholder="Confirm password"
                                            />
                                            <InputError
                                                message={
                                                    errors.password_confirmation
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                size="sm"
                                                disabled={processing}
                                            >
                                                {processing && (
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                )}
                                                {processing
                                                    ? 'Resetting...'
                                                    : 'Reset password'}
                                            </Button>
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
