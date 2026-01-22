import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';

interface Column<T = Record<string, unknown>> {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
    render?: (value: unknown, row: T) => React.ReactNode;
}

interface PaginationData {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

interface DataTableProps<T = Record<string, unknown>> {
    columns: Column<T>[];
    data: T[];
    pagination?: PaginationData;
    onSort?: (column: string) => void;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    emptyMessage?: string;
    loading?: boolean;
}

export default function DataTable<T extends Record<string, unknown> = Record<string, unknown>>({
    columns,
    data,
    pagination,
    onSort,
    sortColumn,
    sortDirection = 'asc',
    emptyMessage = 'No data available',
    loading = false,
}: DataTableProps<T>) {
    const handlePageChange = (page: number) => {
        if (!pagination) return;

        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('page', page.toString());

        router.get(
            `${window.location.pathname}?${currentParams.toString()}`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSort = (column: Column<T>) => {
        if (!column.sortable) return;

        if (onSort) {
            onSort(column.key);
        } else {
            const currentParams = new URLSearchParams(window.location.search);
            const currentSort = currentParams.get('sort');
            const currentDir = currentParams.get('direction');

            if (currentSort === column.key && currentDir === 'asc') {
                currentParams.set('direction', 'desc');
            } else {
                currentParams.set('sort', column.key);
                currentParams.set('direction', 'asc');
            }

            router.get(
                `${window.location.pathname}?${currentParams.toString()}`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        }
    };

    const renderCellContent = (column: Column<T>, row: T): React.ReactNode => {
        const value = row[column.key];

        if (column.render) {
            return column.render(value, row);
        }

        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        return null;
    };

    return (
        <Card className="overflow-hidden">
            {/* Table Container */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={`px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400 ${
                                        column.sortable
                                            ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
                                            : ''
                                    } ${column.className || ''}`}
                                    onClick={() =>
                                        column.sortable && handleSort(column)
                                    }
                                >
                                    <div className="flex items-center gap-1">
                                        {column.label}
                                        {column.sortable &&
                                            sortColumn === column.key && (
                                                <span>
                                                    {sortDirection === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr
                                    key={(row as { id?: string | number }).id ?? index}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-4 py-4 text-sm text-gray-900 dark:text-white ${column.className || ''}`}
                                        >
                                            {renderCellContent(column, row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Info */}
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing{' '}
                            <span className="font-medium">
                                {(pagination.current_page - 1) *
                                    pagination.per_page +
                                    1}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium">
                                {Math.min(
                                    pagination.current_page *
                                        pagination.per_page,
                                    pagination.total,
                                )}
                            </span>{' '}
                            of{' '}
                            <span className="font-medium">
                                {pagination.total}
                            </span>{' '}
                            results
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.current_page === 1}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handlePageChange(
                                        pagination.current_page - 1,
                                    )
                                }
                                disabled={pagination.current_page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Page {pagination.current_page} of{' '}
                                {pagination.last_page}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handlePageChange(
                                        pagination.current_page + 1,
                                    )
                                }
                                disabled={
                                    pagination.current_page ===
                                    pagination.last_page
                                }
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handlePageChange(pagination.last_page)
                                }
                                disabled={
                                    pagination.current_page ===
                                    pagination.last_page
                                }
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
