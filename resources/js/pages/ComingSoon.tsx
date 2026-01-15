import { useEffect, useState } from 'react';
import Input from '../components/form/input/InputField';
import Button from '../components/ui/button/Button';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function ComingSoon() {
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({
        days: 28,
        hours: 23,
        minutes: 54,
        seconds: 44,
    });

    // Countdown timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                const { days, hours, minutes, seconds } = prevTime;

                if (seconds > 0) {
                    return { ...prevTime, seconds: seconds - 1 };
                } else if (minutes > 0) {
                    return { ...prevTime, minutes: minutes - 1, seconds: 59 };
                } else if (hours > 0) {
                    return {
                        ...prevTime,
                        hours: hours - 1,
                        minutes: 59,
                        seconds: 59,
                    };
                } else if (days > 0) {
                    return {
                        ...prevTime,
                        days: days - 1,
                        hours: 23,
                        minutes: 59,
                        seconds: 59,
                    };
                }

                return prevTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubscribed(true);
            setEmail('');
            // Here you would typically send the email to your backend
            console.log('Email subscribed:', email);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 dark:from-gray-900 dark:to-gray-800">
            <div className="mx-auto max-w-2xl text-center">
                {/* Logo */}
                <div className="mb-8">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-white">
                        <span className="text-2xl font-bold">T</span>
                    </div>
                    <h1 className="text-xl font-semibold text-brand-500 dark:text-brand-400">
                        TailAdmin
                    </h1>
                </div>

                {/* Main Heading */}
                <div className="mb-12">
                    <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
                        Coming Soon
                    </h2>
                    <p className="mx-auto max-w-lg text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                        Our website is currently under construction, enter your
                        email id to get latest updates and notifications about
                        the website.
                    </p>
                </div>

                {/* Countdown Timer */}
                <div className="mb-12">
                    <div className="mb-4 flex items-center justify-center gap-4 md:gap-8">
                        <div className="text-center">
                            <div className="min-w-[80px] rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:min-w-[100px] md:p-6 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-2xl font-bold text-brand-500 md:text-4xl dark:text-brand-400">
                                    {timeLeft.days.toString().padStart(2, '0')}
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Days
                            </p>
                        </div>

                        <div className="text-2xl font-bold text-brand-500 md:text-4xl dark:text-brand-400">
                            :
                        </div>

                        <div className="text-center">
                            <div className="min-w-[80px] rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:min-w-[100px] md:p-6 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-2xl font-bold text-brand-500 md:text-4xl dark:text-brand-400">
                                    {timeLeft.hours.toString().padStart(2, '0')}
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Hours
                            </p>
                        </div>

                        <div className="text-2xl font-bold text-brand-500 md:text-4xl dark:text-brand-400">
                            :
                        </div>

                        <div className="text-center">
                            <div className="min-w-[80px] rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:min-w-[100px] md:p-6 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-2xl font-bold text-brand-500 md:text-4xl dark:text-brand-400">
                                    {timeLeft.minutes
                                        .toString()
                                        .padStart(2, '0')}
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Minutes
                            </p>
                        </div>

                        <div className="text-2xl font-bold text-brand-500 md:text-4xl dark:text-brand-400">
                            :
                        </div>

                        <div className="text-center">
                            <div className="min-w-[80px] rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:min-w-[100px] md:p-6 dark:border-gray-700 dark:bg-gray-800">
                                <div className="text-2xl font-bold text-brand-500 md:text-4xl dark:text-brand-400">
                                    {timeLeft.seconds
                                        .toString()
                                        .padStart(2, '0')}
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Seconds
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {timeLeft.days} days left
                    </p>
                </div>

                {/* Email Subscription */}
                <div className="mb-12">
                    <p className="mb-6 text-gray-700 dark:text-gray-300">
                        Don't want to miss update? Subscribe now
                    </p>

                    {isSubscribed ? (
                        <div className="mx-auto max-w-md rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                            <p className="font-medium text-green-700 dark:text-green-400">
                                ✓ Thank you for subscribing! We'll keep you
                                updated.
                            </p>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleEmailSubmit}
                            className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
                        >
                            <div className="flex-1">
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={handleEmailChange}
                                    className="w-full"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="bg-gray-800 px-6 hover:bg-gray-900 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                                disabled={!email}
                            >
                                <svg
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-5 5v-5z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 19h16"
                                    />
                                </svg>
                                Notify Me
                            </Button>
                        </form>
                    )}
                </div>

                {/* Social Media Links */}
                <div>
                    <p className="mb-6 text-gray-700 dark:text-gray-300">
                        Follow Us On
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        {/* Facebook */}
                        <a
                            href="#"
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-blue-800 dark:hover:text-blue-400"
                            aria-label="Facebook"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </a>

                        {/* Twitter/X */}
                        <a
                            href="#"
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
                            aria-label="Twitter"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>

                        {/* LinkedIn */}
                        <a
                            href="#"
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-blue-800 dark:hover:text-blue-400"
                            aria-label="LinkedIn"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>

                        {/* Instagram */}
                        <a
                            href="#"
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-pink-200 hover:text-pink-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-pink-800 dark:hover:text-pink-400"
                            aria-label="Instagram"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.875-.385-.875-.875s.385-.875.875-.875.875.385.875.875-.385.875-.875.875zm-4.262 1.781c-1.297 0-2.345 1.048-2.345 2.345s1.048 2.345 2.345 2.345 2.345-1.048 2.345-2.345-1.048-2.345-2.345-2.345z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
