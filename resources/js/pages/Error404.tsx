import { Head, Link } from '@inertiajs/react';

export default function Error404() {
    return (
        <>
            <Head title="Page Not Found" />

            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center px-6">
                    <div className="mb-8">
                        <h1 className="text-9xl font-bold text-gray-300">404</h1>
                    </div>

                    <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                        Page Not Found
                    </h2>

                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Sorry, the page you are looking for could not be found.
                        It might have been moved or deleted.
                    </p>

                    <div className="space-x-4">
                        <Link
                            href="/"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                        >
                            Go Home
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
