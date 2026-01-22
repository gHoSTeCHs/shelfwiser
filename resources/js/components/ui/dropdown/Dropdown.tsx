
import type React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';

interface DropdownProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	className?: string;
	id?: string;
	triggerId?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
	isOpen,
	onClose,
	children,
	className = '',
	id = 'dropdown-menu',
	triggerId,
}) => {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [focusedIndex, setFocusedIndex] = useState<number>(0);

	/**
	 * Gets all focusable menu items within the dropdown
	 */
	const getFocusableItems = useCallback((): HTMLElement[] => {
		if (!dropdownRef.current) return [];
		const items = Array.from(
			dropdownRef.current.querySelectorAll(
				'[role="menuitem"]:not([disabled]), a:not([disabled]), button:not([disabled])',
			),
		) as HTMLElement[];
		return items.filter((item) => !item.hasAttribute('aria-hidden'));
	}, []);

	/**
	 * Handles keyboard navigation within the dropdown menu
	 */
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!isOpen) return;

			const items = getFocusableItems();
			if (items.length === 0) return;

			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					setFocusedIndex((prev) => {
						const nextIndex = (prev + 1) % items.length;
						items[nextIndex]?.focus();
						return nextIndex;
					});
					break;

				case 'ArrowUp':
					e.preventDefault();
					setFocusedIndex((prev) => {
						const nextIndex = prev === 0 ? items.length - 1 : prev - 1;
						items[nextIndex]?.focus();
						return nextIndex;
					});
					break;

				case 'Home':
					e.preventDefault();
					setFocusedIndex(0);
					items[0]?.focus();
					break;

				case 'End':
					e.preventDefault();
					setFocusedIndex(items.length - 1);
					items[items.length - 1]?.focus();
					break;

				case 'Escape':
					e.preventDefault();
					onClose();
					if (triggerId) {
						document.getElementById(triggerId)?.focus();
					}
					break;

				case 'Tab':
					onClose();
					break;

				default:
					break;
			}
		},
		[isOpen, getFocusableItems, onClose, triggerId],
	);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				!(event.target as HTMLElement).closest('.dropdown-toggle')
			) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	useEffect(() => {
		if (isOpen) {
			document.addEventListener('keydown', handleKeyDown);
			const items = getFocusableItems();
			if (items.length > 0) {
				setFocusedIndex(0);
				items[0]?.focus();
			}
		} else {
			setFocusedIndex(0);
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, handleKeyDown, getFocusableItems]);

	if (!isOpen) return null;

	return (
		<div
			ref={dropdownRef}
			role="menu"
			id={id}
			aria-orientation="vertical"
			className={`absolute z-40  right-0 mt-2  rounded-xl border border-gray-200 bg-white  shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}>
			{children}
		</div>
	);
};
