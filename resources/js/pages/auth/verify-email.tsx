import EmailVerificationNotificationController from '@/actions/App/Http/Controllers/Auth/EmailVerificationNotificationController';
import { logout } from '@/routes';
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { ChevronLeftIcon } from '../../icons';

import TextLink from '@/components/text-link';
import Button from '@/components/ui/button/Button';
import AuthLayout from '@/layouts/AuthPageLayout.tsx';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout>
            <Head title="Email verification" />

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
                                Verify email
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Please verify your email address by clicking on
                                the link we just emailed to you.
                            </p>
                        </div>

                        {status === 'verification-link-sent' && (
                            <div className="mb-4 text-center text-sm font-medium text-green-600">
                                A new verification link has been sent to the
                                email address you provided during registration.
                            </div>
                        )}

                        <div>
                            <Form
                                {...EmailVerificationNotificationController.store.form()}
                                className="space-y-6 text-center"
                            >
                                {({ processing }) => (
                                    <>
                                        <div>
                                            <Button
                                                disabled={processing}
                                                variant="secondary"
                                                size="sm"
                                                className="w-full"
                                            >
                                                {processing && (
                                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                                )}
                                                {processing
                                                    ? 'Sending...'
                                                    : 'Resend verification email'}
                                            </Button>
                                        </div>

                                        <div className="text-center text-sm font-normal text-gray-700 dark:text-gray-400">
                                            <TextLink href={logout.url()}>
                                                Log out
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
