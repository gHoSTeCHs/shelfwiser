import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController.ts';
import { Form, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '../../icons';
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
        <div className="no-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:w-1/2">
            <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
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
                            Create Your Account
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Start your journey by creating your company account
                        </p>
                    </div>
                    <div>
                        <Form
                                {...RegisteredUserController.store.post()}
                            resetOnSuccess={[
                                'password',
                                'password_confirmation',
                            ]}
                            disableWhileProcessing
                        >
                            {({ errors, processing }) => (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        {/* <!-- First Name --> */}
                                        <div className="sm:col-span-1">
                                            <Label htmlFor="fname">
                                                First Name
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="fname"
                                                name="fname"
                                                placeholder="Enter your first name"
                                                required
                                            />
                                            <InputError
                                                message={errors.fname}
                                            />
                                        </div>
                                        {/* <!-- Last Name --> */}
                                        <div className="sm:col-span-1">
                                            <Label htmlFor="lname">
                                                Last Name
                                                <span className="text-error-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="lname"
                                                name="lname"
                                                placeholder="Enter your last name"
                                                required
                                            />
                                            <InputError
                                                message={errors.lname}
                                            />
                                        </div>
                                    </div>
                                    {/* <!-- Email --> */}
                                    <div>
                                        <Label htmlFor="email">
                                            Email
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Enter your email"
                                            required
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div>
                                        <Label htmlFor="company_name">
                                            Company Name
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="company_name"
                                            name="company_name"
                                            placeholder="Enter your company name"
                                        />
                                        <InputError
                                            message={errors.company_name}
                                        />
                                    </div>
                                    {/* <!-- Password --> */}
                                    <div>
                                        <Label htmlFor="password">
                                            Password
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                placeholder="Enter your password"
                                                name="password"
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                required
                                            />
                                            <span
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                                className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
                                            >
                                                {showPassword ? (
                                                    <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                                                ) : (
                                                    <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                                                )}
                                            </span>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>
                                    {/* <!-- Password Confirmation --> */}
                                    <div>
                                        <Label htmlFor="password_confirmation">
                                            Confirm Password
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
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </div>
                                    {/* <!-- Checkbox --> */}
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            className="h-5 w-5"
                                            checked={isChecked}
                                            onChange={setIsChecked}
                                        />
                                        <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                                            By creating an account means you
                                            agree to the{' '}
                                            <span className="text-gray-800 dark:text-white/90">
                                                Terms and Conditions,
                                            </span>{' '}
                                            and our{' '}
                                            <span className="text-gray-800 dark:text-white">
                                                Privacy Policy
                                            </span>
                                        </p>
                                    </div>
                                    {/* <!-- Button --> */}
                                    <div>
                                        <Button
                                            className="w-full"
                                            size="sm"
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Signing up...'
                                                : 'Sign Up'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>

                        <div className="mt-5">
                            <div
                                className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                                Already have an account?{' '}
                                <TextLink href="/login">Sign In</TextLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
