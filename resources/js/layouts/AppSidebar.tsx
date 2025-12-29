import { useSidebar } from '@/context/SidebarContext';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Box,
    Briefcase,
    Building2,
    Calculator,
    FileSpreadsheet,
    FileUser,
    LayoutTemplate,
    Network,
    Settings,
    ShoppingBag,
    Store,
    Users,
    Wrench,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, GridIcon, HorizontaLDots } from '../icons';

type NavItem = {
    name: string;
    icon: React.ReactNode;
    path?: string;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: 'Dashboard',
        path: '/dashboard',
    },
    {
        icon: <Box />,
        name: 'Inventory',
        subItems: [
            { name: 'Products', path: '/products' },
            { name: 'Categories', path: '/categories' },
            { name: 'Stock Movements', path: '/stock-movements' },
            { name: 'Reorder Alerts', path: '/reorder-alerts' },
        ],
    },
    {
        icon: <Wrench />,
        name: 'Services',
        subItems: [
            { name: 'All Services', path: '/services' },
            { name: 'Service Categories', path: '/service-categories' },
        ],
    },
    {
        icon: <ShoppingBag />,
        name: 'Sales & Orders',
        subItems: [
            { name: 'Orders', path: '/orders' },
            { name: 'Returns', path: '/returns' },
            { name: 'Receipts', path: '/receipts' },
            { name: 'Purchase Orders', path: '/purchase-orders' },
        ],
    },
    {
        icon: <Users />,
        name: 'Customers',
        path: '/customers',
    },
    {
        icon: <BarChart3 />,
        name: 'Reports & Analytics',
        subItems: [
            { name: 'Sales Report', path: '/reports/sales' },
            { name: 'Inventory Report', path: '/reports/inventory' },
            { name: 'Suppliers Report', path: '/reports/suppliers' },
            { name: 'Financials', path: '/reports/financials' },
            { name: 'Customer Analytics', path: '/reports/customer-analytics' },
            { name: 'Product Profitability', path: '/reports/product-profitability' },
        ],
    },
    {
        icon: <Network />,
        name: 'Supplier Network',
        subItems: [
            { name: 'Supplier Profile', path: '/supplier/profile' },
            { name: 'Catalog Management', path: '/supplier/catalog' },
            { name: 'Connections', path: '/supplier/connections' },
            { name: 'Incoming Orders', path: '/purchase-orders/supplier' },
        ],
    },
    {
        icon: <Store />,
        name: 'Shop Management',
        path: '/shops',
    },
    {
        icon: <FileUser />,
        name: 'Staff Management',
        path: '/staff',
    },
    {
        icon: <Briefcase />,
        name: 'HR & Payroll',
        subItems: [
            { name: 'Overview', path: '/payroll' },
            { name: 'Pay Runs', path: '/pay-runs', new: true },
            { name: 'Timesheets', path: '/timesheets' },
            { name: 'Wage Advances', path: '/wage-advances' },
            { name: 'Fund Requests', path: '/fund-requests' },
            { name: 'My Payslips', path: '/payroll/my-payslips' },
        ],
    },
    {
        icon: <FileSpreadsheet />,
        name: 'Payroll Reports',
        subItems: [
            { name: 'Summary Report', path: '/payroll/reports/summary' },
            { name: 'Tax Remittance', path: '/payroll/reports/tax' },
            { name: 'Pension Report', path: '/payroll/reports/pension' },
            { name: 'Bank Schedule', path: '/payroll/reports/bank-schedule' },
        ],
    },
    {
        icon: <Calculator />,
        name: 'Payroll Settings',
        subItems: [
            { name: 'Earning Types', path: '/payroll/settings/earning-types' },
            { name: 'Deduction Types', path: '/payroll/settings/deduction-types' },
            { name: 'Pay Calendars', path: '/payroll/settings/pay-calendars' },
            { name: 'Tax Settings', path: '/payroll/settings/tax' },
        ],
    },
];

const othersItems: NavItem[] = [];

const adminItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: 'Admin Dashboard',
        path: '/admin',
    },
    {
        icon: <Building2 />,
        name: 'Tenants',
        path: '/admin/tenants',
    },
    {
        icon: <LayoutTemplate />,
        name: 'Product Templates',
        path: '/admin/product-templates',
    },
    {
        icon: <Settings />,
        name: 'Platform Settings',
        subItems: [
            { name: 'Subscriptions', path: '/admin/subscriptions' },
            { name: 'API Management', path: '/admin/api' },
            { name: 'System Settings', path: '/admin/settings' },
        ],
    },
];

const AppSidebar: React.FC = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const { url, props } = usePage<SharedData>();
    const isSuperAdmin = props.auth?.user?.is_super_admin ?? false;

    const [openSubmenu, setOpenSubmenu] = useState<{
        type: 'main' | 'others' | 'admin';
        index: number;
    } | null>(null);
    const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
        {},
    );
    const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const isActive = useCallback((path: string) => url === path, [url]);

    useEffect(() => {
        let submenuMatched = false;
        const menuTypes = isSuperAdmin
            ? ['main', 'others', 'admin']
            : ['main', 'others'];
        menuTypes.forEach((menuType) => {
            const items =
                menuType === 'main'
                    ? navItems
                    : menuType === 'admin'
                      ? adminItems
                      : othersItems;
            items.forEach((nav, index) => {
                if (nav.subItems) {
                    nav.subItems.forEach((subItem) => {
                        if (isActive(subItem.path)) {
                            setOpenSubmenu({
                                type: menuType as 'main' | 'others' | 'admin',
                                index,
                            });
                            submenuMatched = true;
                        }
                    });
                }
            });
        });

        if (!submenuMatched) {
            setOpenSubmenu(null);
        }
    }, [url, isActive, isSuperAdmin]);

    useEffect(() => {
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => ({
                    ...prevHeights,
                    [key]: subMenuRefs.current[key]?.scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenu]);

    const handleSubmenuToggle = (
        index: number,
        menuType: 'main' | 'others' | 'admin',
    ) => {
        setOpenSubmenu((prevOpenSubmenu) => {
            if (
                prevOpenSubmenu &&
                prevOpenSubmenu.type === menuType &&
                prevOpenSubmenu.index === index
            ) {
                return null;
            }
            return { type: menuType, index };
        });
    };

    const renderMenuItems = (
        items: NavItem[],
        menuType: 'main' | 'others' | 'admin',
    ) => (
        <ul className="flex flex-col gap-4">
            {items.map((nav, index) => (
                <li key={nav.name}>
                    {nav.subItems ? (
                        <button
                            onClick={() => handleSubmenuToggle(index, menuType)}
                            className={`group menu-item ${
                                openSubmenu?.type === menuType &&
                                openSubmenu?.index === index
                                    ? 'menu-item-active'
                                    : 'menu-item-inactive'
                            } cursor-pointer ${
                                !isExpanded && !isHovered
                                    ? 'lg:justify-center'
                                    : 'lg:justify-start'
                            }`}
                        >
                            <span
                                className={`menu-item-icon-size ${
                                    openSubmenu?.type === menuType &&
                                    openSubmenu?.index === index
                                        ? 'menu-item-icon-active'
                                        : 'menu-item-icon-inactive'
                                }`}
                            >
                                {nav.icon}
                            </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <span className="menu-item-text">
                                    {nav.name}
                                </span>
                            )}
                            {(isExpanded || isHovered || isMobileOpen) && (
                                <ChevronDownIcon
                                    className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                                        openSubmenu?.type === menuType &&
                                        openSubmenu?.index === index
                                            ? 'rotate-180 text-brand-500'
                                            : ''
                                    }`}
                                />
                            )}
                        </button>
                    ) : (
                        nav.path && (
                            <Link
                                href={nav.path}
                                className={`group menu-item ${
                                    isActive(nav.path)
                                        ? 'menu-item-active'
                                        : 'menu-item-inactive'
                                }`}
                            >
                                <span
                                    className={`menu-item-icon-size ${
                                        isActive(nav.path)
                                            ? 'menu-item-icon-active'
                                            : 'menu-item-icon-inactive'
                                    }`}
                                >
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text">
                                        {nav.name}
                                    </span>
                                )}
                            </Link>
                        )
                    )}
                    {nav.subItems &&
                        (isExpanded || isHovered || isMobileOpen) && (
                            <div
                                ref={(el) => {
                                    subMenuRefs.current[
                                        `${menuType}-${index}`
                                    ] = el;
                                }}
                                className="overflow-hidden transition-all duration-300"
                                style={{
                                    height:
                                        openSubmenu?.type === menuType &&
                                        openSubmenu?.index === index
                                            ? `${
                                                  subMenuHeight[
                                                      `${menuType}-${index}`
                                                  ]
                                              }px`
                                            : '0px',
                                }}
                            >
                                <ul className="mt-2 ml-9 space-y-1">
                                    {nav.subItems.map((subItem) => (
                                        <li key={subItem.name}>
                                            <Link
                                                href={subItem.path}
                                                className={`menu-dropdown-item ${
                                                    isActive(subItem.path)
                                                        ? 'menu-dropdown-item-active'
                                                        : 'menu-dropdown-item-inactive'
                                                }`}
                                            >
                                                {subItem.name}
                                                <span className="ml-auto flex items-center gap-1">
                                                    {subItem.new && (
                                                        <span
                                                            className={`ml-auto ${
                                                                isActive(
                                                                    subItem.path,
                                                                )
                                                                    ? 'menu-dropdown-badge-active'
                                                                    : 'menu-dropdown-badge-inactive'
                                                            } menu-dropdown-badge`}
                                                        >
                                                            new
                                                        </span>
                                                    )}
                                                    {subItem.pro && (
                                                        <span
                                                            className={`ml-auto ${
                                                                isActive(
                                                                    subItem.path,
                                                                )
                                                                    ? 'menu-dropdown-badge-active'
                                                                    : 'menu-dropdown-badge-inactive'
                                                            } menu-dropdown-badge`}
                                                        >
                                                            pro
                                                        </span>
                                                    )}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                </li>
            ))}
        </ul>
    );

    return (
        <aside
            className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 dark:border-gray-800 dark:bg-gray-900 ${
                isExpanded || isMobileOpen
                    ? 'w-[290px]'
                    : isHovered
                      ? 'w-[290px]'
                      : 'w-[90px]'
            } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`flex py-8 ${
                    !isExpanded && !isHovered
                        ? 'lg:justify-center'
                        : 'justify-start'
                }`}
            >
                <Link href="/">
                    {isExpanded || isHovered || isMobileOpen ? (
                        <>
                            <img
                                className="dark:hidden"
                                src="/images/logo/logo.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                            <img
                                className="hidden dark:block"
                                src="/images/logo/logo-dark.svg"
                                alt="Logo"
                                width={150}
                                height={40}
                            />
                        </>
                    ) : (
                        <img
                            src="/images/logo/logo-icon.svg"
                            alt="Logo"
                            width={32}
                            height={32}
                        />
                    )}
                </Link>
            </div>
            <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        {isSuperAdmin && (
                            <div>
                                <h2
                                    className={`mb-4 flex text-xs leading-[20px] text-gray-400 uppercase ${
                                        !isExpanded && !isHovered
                                            ? 'lg:justify-center'
                                            : 'justify-start'
                                    }`}
                                >
                                    {isExpanded || isHovered || isMobileOpen ? (
                                        'Administration'
                                    ) : (
                                        <HorizontaLDots className="size-6" />
                                    )}
                                </h2>
                                {renderMenuItems(adminItems, 'admin')}
                            </div>
                        )}
                        <div>
                            <h2
                                className={`mb-4 flex text-xs leading-[20px] text-gray-400 uppercase ${
                                    !isExpanded && !isHovered
                                        ? 'lg:justify-center'
                                        : 'justify-start'
                                }`}
                            >
                                {isExpanded || isHovered || isMobileOpen ? (
                                    'Menu'
                                ) : (
                                    <HorizontaLDots className="size-6" />
                                )}
                            </h2>
                            {renderMenuItems(navItems, 'main')}
                        </div>
                        {othersItems.length > 0 && (
                            <div className="">
                                <h2
                                    className={`mb-4 flex text-xs leading-[20px] text-gray-400 uppercase ${
                                        !isExpanded && !isHovered
                                            ? 'lg:justify-center'
                                            : 'justify-start'
                                    }`}
                                >
                                    {isExpanded || isHovered || isMobileOpen ? (
                                        'Others'
                                    ) : (
                                        <HorizontaLDots />
                                    )}
                                </h2>
                                {renderMenuItems(othersItems, 'others')}
                            </div>
                        )}
                    </div>
                </nav>
                {/* {isExpanded || isHovered || isMobileOpen ? (
                    <SidebarWidget />
                ) : null} */}
            </div>
        </aside>
    );
};

export default AppSidebar;
