import React, { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { CloseLineIcon } from "../../../icons";

interface PopoverAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface PopoverProps {
  title?: string;
  content: ReactNode;
  actions?: PopoverAction[];
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  trigger?: "click" | "hover";
  showCloseButton?: boolean;
  className?: string;
  onClose?: () => void;
}

const Popover: React.FC<PopoverProps> = ({
  title,
  content,
  actions = [],
  children,
  position = "bottom",
  trigger = "click",
  showCloseButton = true,
  className = "",
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const showPopover = () => {
    setIsVisible(true);
  };

  const hidePopover = useCallback(() => {
    setIsVisible(false);
    onClose?.();
  }, [onClose]);

  const handleTriggerClick = () => {
    if (trigger === "click") {
      if (isVisible) {
        hidePopover();
      } else {
        showPopover();
      }
    }
  };

  const handleTriggerMouseEnter = () => {
    if (trigger === "hover") {
      showPopover();
    }
  };

  const handleTriggerMouseLeave = () => {
    if (trigger === "hover") {
      hidePopover();
    }
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && popoverRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = triggerRect.top + scrollTop - popoverRect.height - 12;
          left = triggerRect.left + scrollLeft + (triggerRect.width - popoverRect.width) / 2;
          break;
        case "bottom":
          top = triggerRect.bottom + scrollTop + 12;
          left = triggerRect.left + scrollLeft + (triggerRect.width - popoverRect.width) / 2;
          break;
        case "left":
          top = triggerRect.top + scrollTop + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.left + scrollLeft - popoverRect.width - 12;
          break;
        case "right":
          top = triggerRect.top + scrollTop + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.right + scrollLeft + 12;
          break;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 8) left = 8;
      if (left + popoverRect.width > viewportWidth) left = viewportWidth - popoverRect.width - 8;
      if (top < scrollTop + 8) top = scrollTop + 8;
      if (top + popoverRect.height > scrollTop + viewportHeight) {
        top = scrollTop + viewportHeight - popoverRect.height - 8;
      }

      setPopoverPosition({ top, left });
    }
  }, [isVisible, position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isVisible &&
        popoverRef.current &&
        triggerRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        hidePopover();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isVisible) {
        hidePopover();
      }
    };

    if (trigger === "click") {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, trigger, hidePopover]);

  const getArrowClasses = () => {
    const baseArrow = "absolute w-3 h-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transform rotate-45";

    switch (position) {
      case "top":
        return `${baseArrow} -bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0`;
      case "bottom":
        return `${baseArrow} -top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0`;
      case "left":
        return `${baseArrow} -right-1.5 top-1/2 -translate-y-1/2 border-l-0 border-b-0`;
      case "right":
        return `${baseArrow} -left-1.5 top-1/2 -translate-y-1/2 border-r-0 border-t-0`;
      default:
        return `${baseArrow} -top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0`;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        className={`inline-block cursor-pointer ${className}`}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          className="fixed z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700"
          style={{
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
          }}
        >
          <div className={getArrowClasses()} />

          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={hidePopover}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close popover"
                >
                  <CloseLineIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="p-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {content}
            </div>
          </div>

          {actions.length > 0 && (
            <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    hidePopover();
                  }}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-colors
                    ${action.variant === "primary"
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Popover;
