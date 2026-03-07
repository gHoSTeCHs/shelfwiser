import { useAppearance } from '@/hooks/use-appearance';
import { useEffect, useState } from 'react';

function DashboardMockup({ isDark }: { isDark: boolean }) {
    return (
        <div
            className={`overflow-hidden rounded-xl border shadow-2xl ${
                isDark
                    ? 'border-white/10 bg-gray-900'
                    : 'border-gray-200 bg-white'
            }`}
        >
            <div
                className={`flex items-center gap-2 border-b px-4 py-2.5 ${
                    isDark ? 'border-white/10 bg-gray-800' : 'border-gray-100 bg-gray-50'
                }`}
            >
                <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-error-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-warning-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-success-400" />
                </div>
                <div
                    className={`mx-auto h-5 w-48 rounded-md ${
                        isDark ? 'bg-white/5' : 'bg-gray-100'
                    }`}
                />
            </div>
            <div className="p-4">
                <div className="mb-4 grid grid-cols-4 gap-3">
                    {['brand', 'success', 'orange', 'blue-light'].map(
                        (color, i) => (
                            <div
                                key={i}
                                className={`rounded-lg p-3 ${
                                    isDark ? 'bg-white/5' : 'bg-gray-50'
                                }`}
                            >
                                <div
                                    className={`mb-2 h-2 w-8 rounded bg-${color}-${isDark ? '400' : '500'}/30`}
                                />
                                <div
                                    className={`h-4 w-12 rounded ${
                                        isDark ? 'bg-white/10' : 'bg-gray-200'
                                    }`}
                                />
                            </div>
                        ),
                    )}
                </div>
                <div
                    className={`mb-3 h-32 rounded-lg ${
                        isDark ? 'bg-white/5' : 'bg-gray-50'
                    }`}
                >
                    <div className="flex h-full items-end gap-2 p-4">
                        {[60, 80, 45, 90, 70, 55, 85, 65].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 rounded-t-sm bg-brand-500/60"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                                isDark ? 'bg-white/5' : 'bg-gray-50'
                            }`}
                        >
                            <div
                                className={`h-6 w-6 rounded-md ${
                                    isDark ? 'bg-white/10' : 'bg-gray-200'
                                }`}
                            />
                            <div
                                className={`h-2.5 flex-1 rounded ${
                                    isDark ? 'bg-white/10' : 'bg-gray-200'
                                }`}
                            />
                            <div
                                className={`h-2.5 w-16 rounded ${
                                    isDark ? 'bg-white/10' : 'bg-gray-100'
                                }`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function POSMockup({ isDark }: { isDark: boolean }) {
    return (
        <div
            className={`overflow-hidden rounded-xl border shadow-xl ${
                isDark
                    ? 'border-white/10 bg-gray-900'
                    : 'border-gray-200 bg-white'
            }`}
        >
            <div
                className={`flex items-center justify-between border-b px-3 py-2 ${
                    isDark ? 'border-white/10 bg-brand-600' : 'border-gray-100 bg-brand-500'
                }`}
            >
                <div className="h-2 w-12 rounded bg-white/40" />
                <div className="h-2 w-8 rounded bg-white/30" />
            </div>
            <div className="p-3">
                <div className="mb-3 grid grid-cols-3 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={`flex flex-col items-center rounded-lg p-2 ${
                                isDark ? 'bg-white/5' : 'bg-gray-50'
                            }`}
                        >
                            <div
                                className={`mb-1.5 h-6 w-6 rounded-md ${
                                    isDark ? 'bg-white/10' : 'bg-gray-200'
                                }`}
                            />
                            <div
                                className={`h-1.5 w-8 rounded ${
                                    isDark ? 'bg-white/10' : 'bg-gray-200'
                                }`}
                            />
                        </div>
                    ))}
                </div>
                <div
                    className={`mb-2 rounded-lg p-2 ${
                        isDark ? 'bg-white/5' : 'bg-gray-50'
                    }`}
                >
                    {[0, 1].map((i) => (
                        <div
                            key={i}
                            className={`flex items-center justify-between py-1.5 ${
                                i > 0
                                    ? isDark
                                        ? 'border-t border-white/5'
                                        : 'border-t border-gray-100'
                                    : ''
                            }`}
                        >
                            <div
                                className={`h-1.5 w-16 rounded ${
                                    isDark ? 'bg-white/10' : 'bg-gray-200'
                                }`}
                            />
                            <div
                                className={`h-1.5 w-10 rounded ${
                                    isDark ? 'bg-white/10' : 'bg-gray-100'
                                }`}
                            />
                        </div>
                    ))}
                </div>
                <div className="h-7 rounded-lg bg-brand-500" />
            </div>
        </div>
    );
}

function PhoneMockup({ isDark }: { isDark: boolean }) {
    return (
        <div
            className={`overflow-hidden rounded-2xl border shadow-xl ${
                isDark
                    ? 'border-white/10 bg-gray-900'
                    : 'border-gray-200 bg-white'
            }`}
        >
            <div
                className={`flex items-center justify-center border-b py-1.5 ${
                    isDark ? 'border-white/10 bg-gray-800' : 'border-gray-100 bg-gray-50'
                }`}
            >
                <div
                    className={`h-3 w-16 rounded-full ${
                        isDark ? 'bg-white/10' : 'bg-gray-200'
                    }`}
                />
            </div>
            <div className="p-2.5">
                <div
                    className={`mb-2 h-16 rounded-lg ${
                        isDark ? 'bg-gradient-to-r from-brand-600/30 to-brand-500/20' : 'bg-gradient-to-r from-brand-100 to-brand-50'
                    }`}
                >
                    <div className="p-2.5">
                        <div
                            className={`mb-1 h-2 w-14 rounded ${
                                isDark ? 'bg-white/20' : 'bg-brand-300/50'
                            }`}
                        />
                        <div
                            className={`h-1.5 w-20 rounded ${
                                isDark ? 'bg-white/10' : 'bg-brand-200/50'
                            }`}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`rounded-lg p-2 ${
                                isDark ? 'bg-white/5' : 'bg-gray-50'
                            }`}
                        >
                            <div
                                className={`mb-1.5 h-8 w-full rounded ${
                                    isDark ? 'bg-white/10' : 'bg-gray-200'
                                }`}
                            />
                            <div
                                className={`mb-0.5 h-1.5 w-10 rounded ${
                                    isDark ? 'bg-white/10' : 'bg-gray-200'
                                }`}
                            />
                            <div
                                className={`h-1.5 w-6 rounded ${
                                    isDark ? 'bg-brand-400/40' : 'bg-brand-300/50'
                                }`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function DeviceMockups() {
    const { appearance } = useAppearance();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const isDark =
        appearance === 'dark' ||
        (appearance === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <div className="relative mx-auto h-[420px] w-full max-w-lg lg:h-[480px] lg:max-w-none">
            <div
                className={`absolute top-0 right-0 left-8 transition-all duration-1000 ease-out lg:left-4 ${
                    mounted
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-8 opacity-0'
                }`}
                style={{
                    transform: mounted
                        ? 'perspective(1200px) rotateY(-8deg) rotateX(4deg)'
                        : 'perspective(1200px) rotateY(-8deg) rotateX(4deg) translateY(32px)',
                }}
            >
                <DashboardMockup isDark={isDark} />
            </div>

            <div
                className={`absolute right-0 bottom-4 w-[180px] transition-all delay-300 duration-1000 ease-out lg:bottom-0 lg:w-[200px] ${
                    mounted
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-12 opacity-0'
                }`}
                style={{
                    transform: mounted
                        ? 'perspective(1200px) rotateY(-12deg) rotateX(2deg)'
                        : 'perspective(1200px) rotateY(-12deg) rotateX(2deg) translateY(48px)',
                }}
            >
                <POSMockup isDark={isDark} />
            </div>

            <div
                className={`absolute bottom-8 left-0 w-[130px] transition-all delay-500 duration-1000 ease-out lg:bottom-4 lg:w-[140px] ${
                    mounted
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-16 opacity-0'
                }`}
                style={{
                    transform: mounted
                        ? 'perspective(1200px) rotateY(8deg) rotateX(2deg)'
                        : 'perspective(1200px) rotateY(8deg) rotateX(2deg) translateY(64px)',
                }}
            >
                <PhoneMockup isDark={isDark} />
            </div>
        </div>
    );
}
