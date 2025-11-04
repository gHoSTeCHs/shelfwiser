import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import AuthLayout from '@/layouts/AuthPageLayout.tsx';
import { store } from '@/routes/password/confirm';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { ChevronLeftIcon } from '../../icons';

export default function ConfirmPassword() {
    return (
        <AuthLayout>
            <Head title="Confirm password" />

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
                                Confirm your password
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This is a secure area of the application. Please
                                confirm your password before continuing.
                            </p>
                        </div>

                        <div>
                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="space-y-6"
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
                                                    ? 'Confirming...'
                                                    : 'Confirm password'}
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
