import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import { ProgressBar } from '../../components/ui/progress';

export default function ProgressBars() {
  return (
    <>
      <PageMeta
        title="React.js Progress Bars Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Progress Bars Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Progress Bars" />

      <div className="grid grid-cols-1 gap-5 sm:gap-6">
        <ComponentCard title="Default Progress Bar">
          <div className="space-y-4">
            <ProgressBar value={25} size="sm" />
            <ProgressBar value={50} size="md" />
            <ProgressBar value={75} size="lg" showValue />
          </div>
        </ComponentCard>

        <ComponentCard title="Striped Progress Bar">
          <div className="space-y-4">
            <ProgressBar value={30} variant="striped" size="sm" />
            <ProgressBar value={60} variant="striped" size="md" />
            <ProgressBar value={90} variant="striped" size="lg" showValue />
          </div>
        </ComponentCard>

        <ComponentCard title="Animated Progress Bar">
          <div className="space-y-4">
            <ProgressBar value={35} variant="animated" size="sm" />
            <ProgressBar value={65} variant="animated" size="md" />
            <ProgressBar value={95} variant="animated" size="lg" showValue />
          </div>
        </ComponentCard>

        <ComponentCard title="Progress Bar Sizes">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Small</span>
              <ProgressBar value={40} size="sm" className="flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Medium</span>
              <ProgressBar value={60} size="md" className="flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm text-gray-600 dark:text-gray-400">Large</span>
              <ProgressBar value={80} size="lg" showValue className="flex-1" />
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}