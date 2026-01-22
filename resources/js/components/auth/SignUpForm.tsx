import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController.ts';
import { Form, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import InputError from '../form/InputError';
import Label from '../form/Label';
import Checkbox from '../form/input/Checkbox';
import Input from '../form/input/InputField';
import TextLink from '../text-link';
import Button from '../ui/button/Button';

export default function SignUpForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    return (
        <div className="no-scrollbar flex w-full flex-1 flex-col overflow-y-auto">
            <div className="mx-auto mb-4 w-full max-w-md pt-4 sm:pt-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="mb-6 sm:mb-8">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                            Create your account
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Start your journey by creating your company account
                        </p>
                    </div>

                    <Form
                        {...RegisteredUserController.store.post()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                    >
                        {({ errors, processing }) => (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="fname">
                                            First Name{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="fname"
                                            name="fname"
                                            placeholder="John"
                                            required
                                        />
                                        <InputError message={errors.fname} />
                                    </div>
                                    <div>
                                        <Label htmlFor="lname">
                                            Last Name{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="lname"
                                            name="lname"
                                            placeholder="Doe"
                                            required
                                        />
                                        <InputError message={errors.lname} />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="email">
                                        Email{' '}
                                        <span className="text-error-500">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="you@example.com"
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div>
                                    <Label htmlFor="company_name">
                                        Company Name{' '}
                                        <span className="text-error-500">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        type="text"
                                        id="company_name"
                                        name="company_name"
                                        placeholder="Acme Inc."
                                    />
                                    <InputError message={errors.company_name} />
                                </div>

                                <div>
                                    <Label htmlFor="password">
                                        Password{' '}
                                        <span className="text-error-500">
                                            *
                                        </span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Create a password"
                                            name="password"
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
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
                                        type="password"
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        placeholder="Confirm your password"
                                        required
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        className="mt-0.5 h-5 w-5"
                                        checked={isChecked}
                                        onChange={setIsChecked}
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        By creating an account you agree to our{' '}
                                        <span className="text-gray-900 dark:text-white">
                                            Terms
                                        </span>{' '}
                                        and{' '}
                                        <span className="text-gray-900 dark:text-white">
                                            Privacy Policy
                                        </span>
                                    </p>
                                </div>

                                <Button
                                    className="w-full"
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Creating account...'
                                        : 'Create account'}
                                </Button>

                                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                    Already have an account?{' '}
                                    <TextLink href="/login">Sign in</TextLink>
                                </p>
                            </div>
                        )}
                    </Form>
                </motion.div>
            </div>
        </div>
    );
}
