import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import useToast from '@/hooks/useToast';
import AppLayout from '@/layouts/AppLayout';
import { ToastPosition } from '@/types/toast';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    Sparkles,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';

export default function ToastDemo() {
    const toast = useToast();
    const [customMessage, setCustomMessage] = useState(
        'This is a custom toast message!',
    );
    const [customDuration, setCustomDuration] = useState(5000);
    const [customPosition, setCustomPosition] =
        useState<ToastPosition>('top-right');

    const positionOptions = [
        { value: 'top-left', label: 'Top Left' },
        { value: 'top-center', label: 'Top Center' },
        { value: 'top-right', label: 'Top Right' },
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'bottom-center', label: 'Bottom Center' },
        { value: 'bottom-right', label: 'Bottom Right' },
    ];

    const handleCustomToast = () => {
        toast.info(customMessage, {
            duration: customDuration,
            position: customPosition,
        });
    };

    return (
        <>
            <Head title="Toast Notification System Demo" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <Sparkles className="h-8 w-8 text-brand-500" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Toast Notification System
                        </h1>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        A comprehensive toast notification system with full dark
                        mode support, multiple variants, and flexible
                        positioning.
                    </p>
                </div>

                {/* Variant Examples */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                            Toast Variants
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click any button to trigger a toast notification
                            with different variants.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Success */}
                        <div className="space-y-2">
                            <Button
                                variant="primary"
                                fullWidth
                                startIcon={<CheckCircle2 className="h-4 w-4" />}
                                onClick={() =>
                                    toast.success(
                                        'Operation completed successfully!',
                                    )
                                }
                                className="border-success-500 bg-success-500 hover:bg-success-600"
                            >
                                Success Toast
                            </Button>
                            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                For successful operations
                            </p>
                        </div>

                        {/* Error */}
                        <div className="space-y-2">
                            <Button
                                variant="destructive"
                                fullWidth
                                startIcon={<XCircle className="h-4 w-4" />}
                                onClick={() =>
                                    toast.error(
                                        'An error occurred. Please try again.',
                                    )
                                }
                            >
                                Error Toast
                            </Button>
                            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                For errors and failures
                            </p>
                        </div>

                        {/* Warning */}
                        <div className="space-y-2">
                            <Button
                                variant="primary"
                                fullWidth
                                startIcon={
                                    <AlertTriangle className="h-4 w-4" />
                                }
                                onClick={() =>
                                    toast.warning(
                                        'This action requires your attention.',
                                    )
                                }
                                className="border-warning-500 bg-warning-500 hover:bg-warning-600"
                            >
                                Warning Toast
                            </Button>
                            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                For warnings and cautions
                            </p>
                        </div>

                        {/* Info */}
                        <div className="space-y-2">
                            <Button
                                variant="primary"
                                fullWidth
                                startIcon={<Info className="h-4 w-4" />}
                                onClick={() =>
                                    toast.info(
                                        'Here is some helpful information.',
                                    )
                                }
                                className="border-blue-light-500 bg-blue-light-500 hover:bg-blue-light-600"
                            >
                                Info Toast
                            </Button>
                            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                For informational messages
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Position Examples */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                            Toast Positions
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Toasts can be positioned at any corner or center of
                            the screen.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Top Left Position', {
                                    position: 'top-left',
                                })
                            }
                        >
                            Top Left
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Top Center Position', {
                                    position: 'top-center',
                                })
                            }
                        >
                            Top Center
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Top Right Position', {
                                    position: 'top-right',
                                })
                            }
                        >
                            Top Right
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Bottom Left Position', {
                                    position: 'bottom-left',
                                })
                            }
                        >
                            Bottom Left
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Bottom Center Position', {
                                    position: 'bottom-center',
                                })
                            }
                        >
                            Bottom Center
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Bottom Right Position', {
                                    position: 'bottom-right',
                                })
                            }
                        >
                            Bottom Right
                        </Button>
                    </div>
                </Card>

                {/* Duration Examples */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                            Toast Duration
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Control how long toasts remain visible with custom
                            durations.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Quick toast (2 seconds)', {
                                    duration: 2000,
                                })
                            }
                        >
                            2 Seconds
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Standard toast (5 seconds)', {
                                    duration: 5000,
                                })
                            }
                        >
                            5 Seconds
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info('Long toast (10 seconds)', {
                                    duration: 10000,
                                })
                            }
                        >
                            10 Seconds
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() =>
                                toast.info(
                                    'Persistent toast (no auto-dismiss)',
                                    {
                                        duration: 0,
                                    },
                                )
                            }
                        >
                            No Auto-Dismiss
                        </Button>
                    </div>
                </Card>

                {/* Custom Toast Builder */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                            Custom Toast Builder
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Build your own custom toast with specific message,
                            duration, and position.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Message
                            </label>
                            <Input
                                type="text"
                                value={customMessage}
                                onChange={(e) =>
                                    setCustomMessage(e.target.value)
                                }
                                placeholder="Enter toast message"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Duration (ms)
                            </label>
                            <Input
                                type="number"
                                value={customDuration}
                                onChange={(e) =>
                                    setCustomDuration(
                                        parseInt(e.target.value) || 5000,
                                    )
                                }
                                placeholder="5000"
                                min={0}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Position
                            </label>
                            <Select
                                options={positionOptions}
                                defaultValue={customPosition}
                                onChange={(value) =>
                                    setCustomPosition(value as ToastPosition)
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <Button
                            variant="primary"
                            onClick={handleCustomToast}
                            startIcon={<Sparkles className="h-4 w-4" />}
                        >
                            Show Custom Toast
                        </Button>
                    </div>
                </Card>

                {/* Multiple Toasts */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                            Multiple Toasts & Stacking
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Test how multiple toasts stack and display
                            simultaneously.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                toast.success('First success message');
                                setTimeout(
                                    () => toast.error('Second error message'),
                                    300,
                                );
                                setTimeout(
                                    () =>
                                        toast.warning('Third warning message'),
                                    600,
                                );
                                setTimeout(
                                    () => toast.info('Fourth info message'),
                                    900,
                                );
                            }}
                        >
                            Show 4 Toasts
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                for (let i = 1; i <= 5; i++) {
                                    setTimeout(() => {
                                        toast.info(`Toast notification #${i}`);
                                    }, i * 200);
                                }
                            }}
                        >
                            Show 5 Sequential Toasts
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => toast.dismissAll()}
                        >
                            Dismiss All Toasts
                        </Button>
                    </div>
                </Card>

                {/* Usage Example Code */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                            Usage Example
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            How to use the toast system in your components.
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-lg bg-gray-900 p-4 dark:bg-gray-950">
                        <pre className="text-sm text-gray-100">
                            <code>{`import useToast from '@/hooks/useToast';

function MyComponent() {
  const toast = useToast();

  const handleSubmit = async () => {
    try {
      await saveData();
      toast.success('Data saved successfully!');
    } catch (error) {
      toast.error('Failed to save data. Please try again.');
    }
  };

  // Different variants
  toast.success('Success message');
  toast.error('Error message');
  toast.warning('Warning message');
  toast.info('Info message');

  // Custom options
  toast.success('Custom toast', {
    duration: 3000,
    position: 'top-center',
    dismissible: true,
  });

  // Dismiss specific or all toasts
  toast.dismiss(toastId);
  toast.dismissAll();
}`}</code>
                        </pre>
                    </div>
                </Card>
            </div>
        </>
    );
}

ToastDemo.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
