# Dashboard UI/UX Refinement Implementation Plan

**Last Verification:** January 15, 2026

> **⚠️ STATUS: NOT STARTED**
>
> | Phase | Title | Status |
> |-------|-------|--------|
> | 1 | MetricCard Icons & Hover | NOT STARTED |
> | 2 | Dashboard Skeletons | NOT STARTED |
> | 3 | Tab Accessibility | NOT STARTED |
> | 4 | Table Enhancements | PARTIAL (30%) |
> | 5 | Chart Color Variables | NOT STARTED |
> | 6 | react-countup Animation | NOT STARTED |
> | 7 | Full Accessibility | NOT STARTED |
> | 8 | Dark Mode Consistency | PARTIAL (50%) |
>
> **Note:** Skeleton component exists at `@/components/ui/Skeleton` but dashboard-specific skeletons not created.

## Overview

Enhance the dashboard with improved micro-interactions, consistent styling, loading states, and accessibility while
maintaining the existing design system.

---

## Phase 1: Foundation Components (Priority: High)

### 1.1 Enhance MetricCard Component

**File:** `resources/js/components/dashboard/MetricCard.tsx`

**Changes:**

- Replace text arrows (up/down) with Lucide TrendingUp/TrendingDown icons
- Add hover elevation: `hover:shadow-theme-sm transition-shadow duration-200`
- Standardize icon container to `w-12 h-12 rounded-xl`
- Add entrance animation support via optional `delay` prop

```tsx
/** Key changes:
 * - Icon container: p-3 rounded-lg -> w-12 h-12 rounded-xl flex items-center justify-center
 * - Trend: text arrow -> <TrendingUp className="h-3 w-3" /> or <TrendingDown />
 * - Card wrapper: add transition-shadow duration-200 hover:shadow-theme-sm
 */
```

### 1.2 Update Card Component

**File:** `resources/js/components/ui/card/Card.tsx`

**Changes:**

- Add `hover:shadow-theme-sm transition-shadow duration-200` to base classes
- Add optional `noPadding` prop for edge-to-edge chart content
- Separate header section from content for better layout control

---

## Phase 2: Dashboard Skeleton Loaders (Priority: High)

### 2.1 Create Dashboard-Specific Skeletons

**File:** `resources/js/components/dashboard/skeletons/` (new directory)

**New Components:**

- `MetricCardSkeleton.tsx` - Matches MetricCard layout
- `ChartCardSkeleton.tsx` - Card with chart placeholder
- `DashboardSkeleton.tsx` - Full dashboard loading state

### 2.2 Integrate with Inertia Deferred Props

**File:** `resources/js/pages/dashboard.tsx`

**Changes:**

- Wrap tab content with Suspense boundaries
- Show skeletons while data loads per tab
- Use existing Skeleton component from `@/components/ui/Skeleton`

---

## Phase 3: Tab System Improvements (Priority: Medium)

### 3.1 Enhanced Tab Transitions

**File:** `resources/js/components/ui/tabs/Tab.tsx`

**Changes:**

- Add `transition-all duration-200` to TabTrigger
- Add focus styles: `focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:outline-none`
- Add keyboard navigation (ArrowLeft/ArrowRight)
- Add ARIA attributes: `role="tablist"`, `role="tab"`, `aria-selected`

### 3.2 Animate Tab Content

**File:** `resources/js/components/ui/tabs/Tab.tsx` (TabContent)

**Changes:**

- Add fade-in animation when content changes
- Use `animate-in fade-in duration-200` from tailwindcss-animate

---

## Phase 4: Table Enhancements (Priority: Medium)

### 4.1 Consistent Table Styling

**Files:**

- `resources/js/components/dashboard/tabs/SalesTab.tsx`
- `resources/js/components/dashboard/tabs/InventoryTab.tsx`
- `resources/js/components/dashboard/tabs/SuppliersTab.tsx`
- `resources/js/components/dashboard/tabs/FinancialsTab.tsx`

**Changes:**

- Add `transition-colors duration-150` to all table row hovers
- Ensure consistent hover colors across dark/light mode
- Add empty state component when no data

### 4.2 Create TableEmptyState Component

**File:** `resources/js/components/ui/table/TableEmptyState.tsx` (new)

**Props:** icon, title, description

---

## Phase 5: Chart Improvements (Priority: Medium)

### 5.1 Standardize Chart Colors

**Files:**

- `resources/js/components/dashboard/tabs/OverviewTab.tsx`
- `resources/js/components/dashboard/tabs/FinancialsTab.tsx`

**Changes:**

- Replace hardcoded hex colors with CSS custom property references
- Create color mapping object using design tokens:
  ```tsx
  const chartColors = {
    brand: 'var(--color-brand-500)',
    success: 'var(--color-success-500)',
    warning: 'var(--color-warning-400)',
    error: 'var(--color-error-500)',
    info: 'var(--color-blue-light-500)',
  };
  ```

### 5.2 Add Chart Loading States

**Files:**

- `resources/js/components/charts/ReusableLineChart.tsx`
- `resources/js/components/charts/ReusableBarChart.tsx`
- `resources/js/components/charts/ReusablePieChart.tsx`

**Changes:**

- Add optional `loading` prop
- Show skeleton placeholder when loading
- Add entrance animation: `animations: { enabled: true, easing: 'easeinout', speed: 500 }`

---

## Phase 6: Micro-interactions & Animations (Priority: Medium)

### 6.1 Card Entrance Animations

**File:** `resources/js/pages/dashboard.tsx`

**Changes:**

- Add staggered entrance animation to metric cards grid
- Use `animate-in fade-in slide-in-from-bottom-2` with stagger delays

### 6.2 CountUp Animation for Metrics

**File:** `resources/js/components/dashboard/MetricCard.tsx`

**Approach:** Install and use `react-countup` library

**Implementation:**

```bash
npm install react-countup
```

```tsx
import CountUp from 'react-countup';

/** For currency values */
<CountUp end={numericValue} duration={1} separator="," prefix="NGN " decimals={2} />

/** For integer values */
<CountUp end={numericValue} duration={1} separator="," />
```

**Props to add to MetricCard:**

- `animate?: boolean` - Enable/disable counting animation (default: true)
- `duration?: number` - Animation duration in seconds (default: 1)

---

## Phase 7: Accessibility Improvements (Priority: Medium)

### 7.1 Tab Accessibility

**File:** `resources/js/components/ui/tabs/Tab.tsx`

**Changes:**

```tsx
/** TabList */
role = "tablist"
aria - label = "Dashboard sections"

/** TabTrigger */
role = "tab"
aria - selected = { isActive }
tabIndex = { isActive ? 0 : -1 }
onKeyDown = { handleKeyDown }
```

### 7.2 Table Accessibility

**Files:** All tab files with tables

**Changes:**

- Add `aria-label` to tables
- Ensure status badges have `aria-label` for screen readers

### 7.3 Metric Card Accessibility

**File:** `resources/js/components/dashboard/MetricCard.tsx`

**Changes:**

- Add `aria-live="polite"` for dynamic value updates
- Ensure trend direction is announced (not just color)

---

## Phase 8: Dark Mode Consistency (Priority: Low)

### 8.1 Audit and Fix Hover States

**Files:** All dashboard tab components

**Changes:**

- Standardize to `dark:hover:bg-gray-800/50` for all row hovers
- Ensure chart tooltips respect dark mode

---

## Implementation Order (Quick Wins First)

### Batch 1: Quick Wins (Small Effort, High Impact)

| Step | Task                                 | Files          | Effort |
|------|--------------------------------------|----------------|--------|
| 1    | MetricCard icon + trend enhancements | MetricCard.tsx | Small  |
| 2    | Card hover transitions               | Card.tsx       | Small  |
| 3    | Tab transitions + focus states       | Tab.tsx        | Small  |
| 4    | Table row transition consistency     | 4 tab files    | Small  |
| 5    | Dark mode hover audit                | All tab files  | Small  |

### Batch 2: Loading States (Medium Effort)

| Step | Task                          | Files              | Effort |
|------|-------------------------------|--------------------|--------|
| 6    | Dashboard skeleton components | New skeleton files | Medium |
| 7    | Chart loading states          | 3 chart components | Medium |
| 8    | Integrate skeletons in tabs   | Tab components     | Medium |

### Batch 3: Animations & Polish (Medium Effort)

| Step | Task                        | Files                      | Effort |
|------|-----------------------------|----------------------------|--------|
| 9    | Install react-countup       | package.json               | Small  |
| 10   | CountUp in MetricCard       | MetricCard.tsx             | Small  |
| 11   | Card entrance animations    | dashboard.tsx              | Small  |
| 12   | Chart color standardization | OverviewTab, FinancialsTab | Medium |

### Batch 4: Accessibility (Medium Effort)

| Step | Task                    | Files          | Effort |
|------|-------------------------|----------------|--------|
| 13   | Tab ARIA + keyboard nav | Tab.tsx        | Medium |
| 14   | Table accessibility     | Tab components | Small  |
| 15   | Metric card aria-live   | MetricCard.tsx | Small  |

---

## Dependencies to Install

```bash
npm install react-countup
```

---

## Files to Modify

### Core Components

- `resources/js/components/dashboard/MetricCard.tsx`
- `resources/js/components/ui/card/Card.tsx`
- `resources/js/components/ui/tabs/Tab.tsx`

### Dashboard Tabs

- `resources/js/components/dashboard/tabs/OverviewTab.tsx`
- `resources/js/components/dashboard/tabs/SalesTab.tsx`
- `resources/js/components/dashboard/tabs/InventoryTab.tsx`
- `resources/js/components/dashboard/tabs/SuppliersTab.tsx`
- `resources/js/components/dashboard/tabs/FinancialsTab.tsx`

### Charts

- `resources/js/components/charts/ReusableLineChart.tsx`
- `resources/js/components/charts/ReusableBarChart.tsx`
- `resources/js/components/charts/ReusablePieChart.tsx`

### Dashboard Page

- `resources/js/pages/dashboard.tsx`

### New Files

- `resources/js/components/dashboard/skeletons/MetricCardSkeleton.tsx`
- `resources/js/components/dashboard/skeletons/ChartCardSkeleton.tsx`
- `resources/js/components/dashboard/skeletons/DashboardSkeleton.tsx`
- `resources/js/components/ui/table/TableEmptyState.tsx`

---

## Notes

- `tailwindcss-animate` is already installed
- Existing Skeleton component (`@/components/ui/Skeleton`) can be reused
- All changes are backwards compatible
- Design tokens already defined in `resources/css/app.css`
