import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import { Ribbon } from '../../components/ui/ribbon';

export default function Ribbons() {
  return (
    <>
      <PageMeta
        title="React.js Ribbons Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ribbons Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Ribbons" />

      <div className="grid grid-cols-1 gap-5 sm:gap-6">
        <ComponentCard title="Rounded Ribbon">
          <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <Ribbon variant="rounded">New</Ribbon>
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-600 dark:text-gray-400">Content Area</p>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Filled Ribbon">
          <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <Ribbon variant="filled">Featured</Ribbon>
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-600 dark:text-gray-400">Content Area</p>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Hover Ribbon">
          <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <Ribbon variant="hover">Hover Me</Ribbon>
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-600 dark:text-gray-400">Content Area</p>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Ribbon Positions">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <Ribbon variant="rounded" position="top-left">Top Left</Ribbon>
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-600 dark:text-gray-400">Content Area</p>
              </div>
            </div>
            <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <Ribbon variant="rounded" position="top-right">Top Right</Ribbon>
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-600 dark:text-gray-400">Content Area</p>
              </div>
            </div>
            <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <Ribbon variant="rounded" position="bottom-left">Bottom Left</Ribbon>
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-600 dark:text-gray-400">Content Area</p>
              </div>
            </div>
            <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <Ribbon variant="rounded" position="bottom-right">Bottom Right</Ribbon>
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-600 dark:text-gray-400">Content Area</p>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}