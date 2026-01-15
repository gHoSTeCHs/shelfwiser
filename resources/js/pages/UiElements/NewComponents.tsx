import { useState } from 'react';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import Button from '../../components/ui/button/Button';
import Pagination from '../../components/ui/pagination/Pagination';
import Popover from '../../components/ui/popover/Popover';
import Toggle from '../../components/ui/toggle/Toggle';
import Tooltip from '../../components/ui/tooltip/Tooltip';
import { MailIcon, UserIcon } from '../../icons';

export default function NewComponents() {
    const [toggleStates, setToggleStates] = useState({
        simple: false,
        withLabel: true,
        disabled: false,
        small: false,
        large: true,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [simplePage, setSimplePage] = useState(1);
    const [compactPage, setCompactPage] = useState(1);

    const handleToggleChange = (key: string) => (checked: boolean) => {
        setToggleStates((prev) => ({ ...prev, [key]: checked }));
    };

    const popoverActions = [
        {
            label: 'Save',
            onClick: () => console.log('Save clicked'),
            variant: 'primary' as const,
        },
        {
            label: 'Cancel',
            onClick: () => console.log('Cancel clicked'),
            variant: 'secondary' as const,
        },
    ];

    return (
        <>
            <PageMeta
                title="New UI Components | TailAdmin - React.js Admin Dashboard Template"
                description="New UI Components including Toggle, Tooltip, Popover, and Pagination for TailAdmin React.js Dashboard"
            />

            <div className="space-y-6">
                <ComponentCard title="Toggle/Switch Components">
                    <div className="space-y-6">
                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Basic Toggles
                            </h4>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300">
                                        Simple Toggle
                                    </h5>
                                    <Toggle
                                        checked={toggleStates.simple}
                                        onChange={handleToggleChange('simple')}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300">
                                        With Label
                                    </h5>
                                    <Toggle
                                        checked={toggleStates.withLabel}
                                        onChange={handleToggleChange(
                                            'withLabel',
                                        )}
                                        label="Enable notifications"
                                        description="Get notified when someone mentions you"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300">
                                        Disabled
                                    </h5>
                                    <Toggle
                                        checked={toggleStates.disabled}
                                        onChange={handleToggleChange(
                                            'disabled',
                                        )}
                                        disabled
                                        label="Disabled toggle"
                                        description="This toggle is disabled"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Different Sizes
                            </h4>
                            <div className="flex items-center gap-8">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Small
                                    </p>
                                    <Toggle
                                        size="sm"
                                        checked={toggleStates.small}
                                        onChange={handleToggleChange('small')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Medium (Default)
                                    </p>
                                    <Toggle
                                        size="md"
                                        checked={toggleStates.simple}
                                        onChange={handleToggleChange('simple')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Large
                                    </p>
                                    <Toggle
                                        size="lg"
                                        checked={toggleStates.large}
                                        onChange={handleToggleChange('large')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </ComponentCard>

                <ComponentCard title="Tooltip Components">
                    <div className="space-y-6">
                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Tooltip Positions
                            </h4>
                            <div className="flex flex-wrap items-center gap-4">
                                <Tooltip
                                    content="This tooltip appears on top"
                                    position="top"
                                >
                                    <Button>Top Tooltip</Button>
                                </Tooltip>

                                <Tooltip
                                    content="This tooltip appears on the bottom"
                                    position="bottom"
                                >
                                    <Button>Bottom Tooltip</Button>
                                </Tooltip>

                                <Tooltip
                                    content="This tooltip appears on the left"
                                    position="left"
                                >
                                    <Button>Left Tooltip</Button>
                                </Tooltip>

                                <Tooltip
                                    content="This tooltip appears on the right"
                                    position="right"
                                >
                                    <Button>Right Tooltip</Button>
                                </Tooltip>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Tooltip with Icons
                            </h4>
                            <div className="flex items-center gap-4">
                                <Tooltip content="User profile information">
                                    <UserIcon className="h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
                                </Tooltip>

                                <Tooltip content="Send an email" delay={100}>
                                    <MailIcon className="h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </ComponentCard>

                <ComponentCard title="Popover Components">
                    <div className="space-y-6">
                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Click Popovers
                            </h4>
                            <div className="flex flex-wrap items-center gap-4">
                                <Popover
                                    title="User Settings"
                                    content={
                                        <div className="space-y-3">
                                            <p>
                                                Configure your account settings
                                                and preferences.
                                            </p>
                                            <div className="space-y-2">
                                                <Toggle label="Email notifications" />
                                                <Toggle label="Push notifications" />
                                            </div>
                                        </div>
                                    }
                                    actions={popoverActions}
                                    position="bottom"
                                >
                                    <Button>Settings Popover</Button>
                                </Popover>

                                <Popover
                                    content="This is a simple popover without title or actions."
                                    position="top"
                                    showCloseButton={false}
                                >
                                    <Button variant="outline">
                                        Simple Popover
                                    </Button>
                                </Popover>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Hover Popovers
                            </h4>
                            <div className="flex items-center gap-4">
                                <Popover
                                    title="Quick Info"
                                    content="This popover appears on hover and disappears when you move away."
                                    trigger="hover"
                                    showCloseButton={false}
                                    position="right"
                                >
                                    <span className="cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-300">
                                        Hover me
                                    </span>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </ComponentCard>

                <ComponentCard title="Pagination Components">
                    <div className="space-y-8">
                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Numbered Pagination
                            </h4>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={10}
                                onPageChange={setCurrentPage}
                                variant="numbered"
                            />
                        </div>

                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Simple Pagination
                            </h4>
                            <Pagination
                                currentPage={simplePage}
                                totalPages={5}
                                onPageChange={setSimplePage}
                                variant="simple"
                            />
                        </div>

                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Compact Pagination
                            </h4>
                            <Pagination
                                currentPage={compactPage}
                                totalPages={8}
                                onPageChange={setCompactPage}
                                variant="compact"
                            />
                        </div>

                        <div>
                            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Disabled Pagination
                            </h4>
                            <Pagination
                                currentPage={1}
                                totalPages={5}
                                onPageChange={() => {}}
                                variant="numbered"
                                disabled
                            />
                        </div>
                    </div>
                </ComponentCard>
            </div>
        </>
    );
}
