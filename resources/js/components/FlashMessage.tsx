import { useOptionalSidebar } from '@/context/SidebarContext';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

export default function FlashMessage() {
    const { flash } = usePage<{ flash: FlashMessages }>().props;
    const sidebar = useOptionalSidebar();
    const isExpanded = sidebar?.isExpanded ?? false;
    const isHovered = sidebar?.isHovered ?? false;
    const [visible, setVisible] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const newVisible: Record<string, boolean> = {};
        Object.keys(flash || {}).forEach((key) => {
            if (flash[key as keyof FlashMessages]) {
                newVisible[key] = true;
            }
        });
        setVisible(newVisible);

        const timer = setTimeout(() => {
            setVisible({});
        }, 5000);

        return () => clearTimeout(timer);
    }, [flash]);

    const types = {
        success: {
            icon: CheckCircle,
            className:
                'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        },
        error: {
            icon: XCircle,
            className:
                'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        },
        warning: {
            icon: AlertCircle,
            className:
                'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        },
        info: {
            icon: Info,
            className:
                'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        },
    };

    const rightPosition = isExpanded || isHovered ? 'lg:right-4' : 'lg:right-4';

    return (
        <div className={`fixed top-20 right-4 z-50 space-y-2 ${rightPosition}`}>
            {Object.entries(flash || {}).map(([type, message]) => {
                if (!message || !visible[type]) return null;

                const config = types[type as keyof typeof types];
                const Icon = config.icon;

                return (
                    <div
                        key={type}
                        className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all ${config.className} max-w-md min-w-[320px] animate-in slide-in-from-right`}
                    >
                        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <p className="flex-1 text-sm font-medium">{message}</p>
                        <button
                            onClick={() =>
                                setVisible((prev) => ({
                                    ...prev,
                                    [type]: false,
                                }))
                            }
                            className="flex-shrink-0 opacity-70 transition-opacity hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
