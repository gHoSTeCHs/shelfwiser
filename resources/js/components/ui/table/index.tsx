import React, { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
}

/**
 * Props for TableCell component
 */
interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  scope?: 'col' | 'row';
  className?: string;
}

/**
 * Table component with semantic HTML table element
 */
const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={`min-w-full  ${className}`}>{children}</table>;
};

/**
 * TableHeader component for table head section
 */
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={className}>{children}</thead>;
};

/**
 * TableBody component for table body section
 */
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

/**
 * TableRow component for table rows
 */
const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return <tr className={className}>{children}</tr>;
};

/**
 * TableCell component that renders th or td with proper scope attribute
 */
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  scope,
  className,
}) => {
  const CellTag = isHeader ? "th" : "td";
  const scopeAttr = isHeader && scope ? { scope } : {};

  return <CellTag className={` ${className}`} {...scopeAttr}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
