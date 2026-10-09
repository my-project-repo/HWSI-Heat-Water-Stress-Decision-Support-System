import * as Tabs from '@radix-ui/react-tabs';
import { BlockExplainer } from './BlockExplainer';
import { AllocationPanel } from './AllocationPanel';
import { CredibilityPanel } from './CredibilityPanel';
import type { BlockExplanation } from '@/lib/types';

interface SidebarTabsProps {
  explanation: BlockExplanation | null;
  isExplainLoading: boolean;
  extraDays: number;
}

export function SidebarTabs({ explanation, isExplainLoading, extraDays }: SidebarTabsProps) {
  return (
    <Tabs.Root defaultValue="overview" className="flex flex-col h-full bg-white">
      <Tabs.List className="flex border-b border-gray-200 shrink-0">
        <Tabs.Trigger value="overview" className="flex-1 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors">
          Overview
        </Tabs.Trigger>
        <Tabs.Trigger value="allocation" className="flex-1 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors">
          Allocation
        </Tabs.Trigger>
        <Tabs.Trigger value="credibility" className="flex-1 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors">
          Credibility
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview" className="flex-1 min-h-0 outline-none">
        <BlockExplainer explanation={explanation} isLoading={isExplainLoading} extraDays={extraDays} />
      </Tabs.Content>
      
      <Tabs.Content value="allocation" className="flex-1 min-h-0 outline-none">
        <AllocationPanel extraDays={extraDays} />
      </Tabs.Content>
      
      <Tabs.Content value="credibility" className="flex-1 min-h-0 outline-none">
        <CredibilityPanel />
      </Tabs.Content>
    </Tabs.Root>
  );
}
