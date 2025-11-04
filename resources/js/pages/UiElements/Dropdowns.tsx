import { useState } from 'react';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import {
	Dropdown,
	DropdownItem,
	DropdownHeader,
	DropdownDivider,
	DropdownLabel,
} from '../../components/ui/dropdown';
import {
	Settings,
	User,
	LogOut,
	MoreVertical,
	Edit,
	Trash,
	Mail,
	Bell,
	HelpCircle,
	Download,
	Archive,
	AlertCircle,
} from 'lucide-react';

export default function Dropdowns() {
	const [isOpen1, setIsOpen1] = useState(false);
	const [isOpen2, setIsOpen2] = useState(false);
	const [isOpen3, setIsOpen3] = useState(false);
	const [isOpen4, setIsOpen4] = useState(false);
	const [isOpen5, setIsOpen5] = useState(false);

	return (
		<>
			<PageMeta
				title="React.js Dropdowns Dashboard | TailAdmin - React.js Admin Dashboard Template"
				description="This is React.js Dropdowns Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
			/>
			<PageBreadcrumb pageTitle="Dropdowns" />

			<div className="grid grid-cols-1 gap-5 sm:gap-6">
				<ComponentCard title="Default Dropdown">
					<div className="flex flex-wrap items-center gap-4">
						<div className="relative">
							<button
								onClick={() => setIsOpen1(!isOpen1)}
								className="dropdown-toggle inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]">
								Options
							</button>
							<Dropdown isOpen={isOpen1} onClose={() => setIsOpen1(false)}>
								<DropdownHeader
									title="John Doe"
									subtitle="john@example.com"
									avatar={
										<div className="size-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-medium">
											JD
										</div>
									}
								/>
								<DropdownDivider />
								<DropdownLabel>Account</DropdownLabel>
								<DropdownItem icon={<Settings className="size-4" />}>
									Settings
								</DropdownItem>
								<DropdownItem icon={<User className="size-4" />}>
									Profile
								</DropdownItem>
								<DropdownItem icon={<Mail className="size-4" />}>
									Messages
								</DropdownItem>
								<DropdownDivider />
								<DropdownItem
									icon={<LogOut className="size-4" />}
									variant="destructive">
									Logout
								</DropdownItem>
							</Dropdown>
						</div>

						<div className="relative">
							<button
								onClick={() => setIsOpen2(!isOpen2)}
								className="dropdown-toggle inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]">
								Disabled Items
							</button>
							<Dropdown isOpen={isOpen2} onClose={() => setIsOpen2(false)}>
								<DropdownItem>Active Item</DropdownItem>
								<DropdownItem disabled>Disabled Item</DropdownItem>
								<DropdownItem>Another Item</DropdownItem>
							</Dropdown>
						</div>
					</div>
				</ComponentCard>

				<ComponentCard title="Icon Dropdown">
					<div className="flex flex-wrap items-center gap-4">
						<div className="relative">
							<button
								onClick={() => setIsOpen3(!isOpen3)}
								className="dropdown-toggle inline-flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]">
								<MoreVertical className="size-5" />
							</button>
							<Dropdown isOpen={isOpen3} onClose={() => setIsOpen3(false)}>
								<DropdownItem icon={<Edit className="size-4" />}>
									Edit
								</DropdownItem>
								<DropdownItem
									icon={<Trash className="size-4" />}
									variant="destructive">
									Delete
								</DropdownItem>
							</Dropdown>
						</div>

						<div className="relative">
							<button
								onClick={() => setIsOpen4(!isOpen4)}
								className="dropdown-toggle inline-flex items-center justify-center size-10 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]">
								<Bell className="size-5" />
							</button>
							<Dropdown isOpen={isOpen4} onClose={() => setIsOpen4(false)}>
								<DropdownLabel>Notifications</DropdownLabel>
								<DropdownItem icon={<Mail className="size-4" />}>
									New Message
								</DropdownItem>
								<DropdownItem icon={<Bell className="size-4" />}>
									New Notification
								</DropdownItem>
								<DropdownDivider />
								<DropdownItem icon={<Settings className="size-4" />}>
									Notification Settings
								</DropdownItem>
							</Dropdown>
						</div>
					</div>
				</ComponentCard>

				<ComponentCard title="Dropdown Variants">
					<div className="flex flex-wrap items-center gap-4">
						<div className="relative">
							<button
								onClick={() => setIsOpen5(!isOpen5)}
								className="dropdown-toggle inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]">
								Actions
							</button>
							<Dropdown isOpen={isOpen5} onClose={() => setIsOpen5(false)}>
								<DropdownLabel>Quick Actions</DropdownLabel>
								<DropdownItem icon={<Download className="size-4" />}>
									Download
								</DropdownItem>
								<DropdownItem icon={<Archive className="size-4" />}>
									Archive
								</DropdownItem>
								<DropdownDivider />
								<DropdownLabel>Help</DropdownLabel>
								<DropdownItem icon={<HelpCircle className="size-4" />}>
									Documentation
								</DropdownItem>
								<DropdownItem icon={<AlertCircle className="size-4" />}>
									Support
								</DropdownItem>
							</Dropdown>
						</div>
					</div>
				</ComponentCard>
			</div>
		</>
	);
}
