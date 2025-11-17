import { useState, useEffect } from 'react';
import { Dropdown } from '../ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Bell,
    FileText,
    Clock,
    DollarSign,
    CheckCircle,
    XCircle,
    FileIcon,
    FilePlus,
    HandCoins,
    TrendingUp,
} from 'lucide-react';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    icon: string;
    color: string;
    shop: {
        id: number;
        name: string;
    } | null;
}

const iconMap: Record<string, any> = {
    'file-text': FileText,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    clock: Clock,
    'dollar-sign': DollarSign,
    'file-plus': FilePlus,
    'hand-coins': HandCoins,
    'trending-up': TrendingUp,
};

const colorMap: Record<string, string> = {
    success: 'bg-success-100 text-success-600',
    error: 'bg-error-100 text-error-600',
    warning: 'bg-warning-100 text-warning-600',
    info: 'bg-info-100 text-info-600',
    light: 'bg-gray-100 text-gray-600',
};

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const closeDropdown = () => {
        setIsOpen(false);
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            try {
                await axios.post(`/notifications/${notification.id}/mark-as-read`);
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notification.id ? { ...n, is_read: true } : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        if (notification.action_url) {
            closeDropdown();
            router.visit(notification.action_url);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/notifications/mark-all-as-read');
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName] || Bell;
        return IconComponent;
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return `${Math.floor(seconds / 604800)}w ago`;
    };

    return (
        <div className="relative">
            <button
                className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                onClick={toggleDropdown}
            >
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                        fill="currentColor"
                    />
                </svg>
            </button>
            <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg sm:w-[361px] lg:right-0 dark:border-gray-800 dark:bg-gray-dark"
            >
                <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Notifications
                    </h5>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-primary-600 hover:text-primary-700"
                            >
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={toggleDropdown}
                            className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg
                                className="fill-current"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
                    {loading ? (
                        <li className="flex items-center justify-center py-8 text-sm text-gray-500">
                            Loading notifications...
                        </li>
                    ) : notifications.length === 0 ? (
                        <li className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="mb-2 h-12 w-12 text-gray-400" />
                            <p className="text-sm text-gray-500">No notifications yet</p>
                        </li>
                    ) : (
                        notifications.map((notification) => {
                            const Icon = getIcon(notification.icon);
                            const colorClass = colorMap[notification.color] || colorMap.light;

                            return (
                                <li key={notification.id}>
                                    <button
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex w-full gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 text-left transition hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                                            !notification.is_read ? 'bg-primary-50/30' : ''
                                        }`}
                                    >
                                        <span
                                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </span>

                                        <span className="block flex-1">
                                            <span className="mb-1.5 block space-x-1 text-theme-sm">
                                                <span className="font-medium text-gray-800 dark:text-white/90">
                                                    {notification.title}
                                                </span>
                                            </span>

                                            <span className="mb-2 block text-xs text-gray-600 dark:text-gray-400">
                                                {notification.message}
                                            </span>

                                            <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                                                {notification.shop && (
                                                    <>
                                                        <span>{notification.shop.name}</span>
                                                        <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                                                    </>
                                                )}
                                                <span>{getTimeAgo(notification.created_at)}</span>
                                            </span>
                                        </span>

                                        {!notification.is_read && (
                                            <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600"></span>
                                        )}
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </Dropdown>
        </div>
    );
}
