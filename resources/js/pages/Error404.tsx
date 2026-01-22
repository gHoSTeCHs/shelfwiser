import { Head, Link } from '@inertiajs/react';

export default function Error404() {
    return (
        <>
            <Head title="Page Not Found" />

            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="px-6 text-center">
                    <div className="mb-8">
                        <h1 className="text-9xl font-bold text-gray-300">
                            404
                        </h1>
                    </div>

                    <h2 className="mb-4 text-3xl font-semibold text-gray-800">
                        Page Not Found
                    </h2>

                    <p className="mx-auto mb-8 max-w-md text-gray-600">
                        Sorry, the page you are looking for could not be found.
                        It might have been moved or deleted.
                    </p>

                    <div className="space-x-4">
                        <Link
                            href="/"
                            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
                        >
                            Go Home
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="inline-block rounded-lg bg-gray-200 px-6 py-3 text-gray-700 transition hover:bg-gray-300"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
