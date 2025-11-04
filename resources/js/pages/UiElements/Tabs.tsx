import { useState } from 'react';
import { Tab, TabList, TabTrigger, TabContent } from '../../components/ui/tabs/Tab';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import { BarChart3, Bell, Settings, Users } from 'lucide-react';

export default function Tabs() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeUnderlineTab, setActiveUnderlineTab] = useState('overview');
  const [activeIconTab, setActiveIconTab] = useState('overview');
  const [activeBadgeTab, setActiveBadgeTab] = useState('overview');

  return (
    <>
      <PageMeta
        title="React.js Tabs Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Tabs Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Tabs" />

      <div className="grid grid-cols-1 gap-5 sm:gap-6">
        <ComponentCard title="Default Tab">
          <Tab>
            <TabList>
              <TabTrigger
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}>
                Overview
              </TabTrigger>
              <TabTrigger
                isActive={activeTab === 'notification'}
                onClick={() => setActiveTab('notification')}>
                Notification
              </TabTrigger>
              <TabTrigger
                isActive={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}>
                Analytics
              </TabTrigger>
              <TabTrigger
                isActive={activeTab === 'customers'}
                onClick={() => setActiveTab('customers')}>
                Customers
              </TabTrigger>
            </TabList>
            <TabContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeTab === 'overview' && 'Overview ipsum dolor sit amet consectetur. Non vitae facilisis urna tortor placerat egestas donec. Faucibus diam gravida enim elit lacus a.'}
                {activeTab === 'notification' && 'Notification ipsum dolor sit amet consectetur. Non vitae facilisis urna tortor placerat egestas donec.'}
                {activeTab === 'analytics' && 'Analytics ipsum dolor sit amet consectetur. Non vitae facilisis urna tortor placerat egestas donec.'}
                {activeTab === 'customers' && 'Customers ipsum dolor sit amet consectetur. Non vitae facilisis urna tortor placerat egestas donec.'}
              </p>
            </TabContent>
          </Tab>
        </ComponentCard>

        <ComponentCard title="Tab With Underline">
          <Tab>
            <TabList variant="underline">
              <TabTrigger
                variant="underline"
                isActive={activeUnderlineTab === 'overview'}
                onClick={() => setActiveUnderlineTab('overview')}>
                Overview
              </TabTrigger>
              <TabTrigger
                variant="underline"
                isActive={activeUnderlineTab === 'notification'}
                onClick={() => setActiveUnderlineTab('notification')}>
                Notification
              </TabTrigger>
              <TabTrigger
                variant="underline"
                isActive={activeUnderlineTab === 'analytics'}
                onClick={() => setActiveUnderlineTab('analytics')}>
                Analytics
              </TabTrigger>
              <TabTrigger
                variant="underline"
                isActive={activeUnderlineTab === 'customers'}
                onClick={() => setActiveUnderlineTab('customers')}>
                Customers
              </TabTrigger>
            </TabList>
            <TabContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Overview ipsum dolor sit amet consectetur. Non vitae facilisis urna tortor placerat egestas donec. Faucibus diam gravida enim elit lacus a.
              </p>
            </TabContent>
          </Tab>
        </ComponentCard>

        <ComponentCard title="Tab with line and icon">
          <Tab>
            <TabList variant="icon">
              <TabTrigger
                variant="icon"
                isActive={activeIconTab === 'overview'}
                onClick={() => setActiveIconTab('overview')}>
                <Settings className="size-5" />
                Overview
              </TabTrigger>
              <TabTrigger
                variant="icon"
                isActive={activeIconTab === 'notification'}
                onClick={() => setActiveIconTab('notification')}>
                <Bell className="size-5" />
                Notification
              </TabTrigger>
              <TabTrigger
                variant="icon"
                isActive={activeIconTab === 'analytics'}
                onClick={() => setActiveIconTab('analytics')}>
                <BarChart3 className="size-5" />
                Analytics
              </TabTrigger>
              <TabTrigger
                variant="icon"
                isActive={activeIconTab === 'customers'}
                onClick={() => setActiveIconTab('customers')}>
                <Users className="size-5" />
                Customers
              </TabTrigger>
            </TabList>
            <TabContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Notification ipsum dolor sit amet consectetur. Non vitae facilisis urna tortor placerat egestas donec.
              </p>
            </TabContent>
          </Tab>
        </ComponentCard>

        <ComponentCard title="Tab with badge">
          <Tab>
            <TabList variant="badge">
              <TabTrigger
                variant="badge"
                isActive={activeBadgeTab === 'overview'}
                onClick={() => setActiveBadgeTab('overview')}>
                Overview
              </TabTrigger>
              <TabTrigger
                variant="badge"
                isActive={activeBadgeTab === 'notification'}
                onClick={() => setActiveBadgeTab('notification')}>
                Notification
              </TabTrigger>
              <TabTrigger
                variant="badge"
                isActive={activeBadgeTab === 'analytics'}
                onClick={() => setActiveBadgeTab('analytics')}>
                Analytics
              </TabTrigger>
              <TabTrigger
                variant="badge"
                isActive={activeBadgeTab === 'customers'}
                onClick={() => setActiveBadgeTab('customers')}>
                Customers
              </TabTrigger>
            </TabList>
            <TabContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Overview ipsum dolor sit amet consectetur. Non vitae facilisis urna tortor placerat egestas donec.
              </p>
            </TabContent>
          </Tab>
        </ComponentCard>
      </div>
    </>
  );
}