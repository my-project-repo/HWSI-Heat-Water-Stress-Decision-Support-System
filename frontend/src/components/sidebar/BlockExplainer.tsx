'use client';

import useSWR from 'swr';
import * as Accordion from '@radix-ui/react-accordion';
import { DataBadge } from '@/components/common/DataBadge';
import { formatNumber } from '@/lib/utils';
import { fetchBlockBulletin } from '@/lib/api';
import type { BlockExplanation, IndicatorDetail } from '@/lib/types';
import { ChevronDown, Sparkles } from 'lucide-react';

interface BlockExplainerProps {
  explanation: BlockExplanation | null;
  isLoading: boolean;
  extraDays?: number;
}

export function BlockExplainer({ explanation, isLoading, extraDays = 0 }: BlockExplainerProps) {
  // Fetch bilingual emergency bulletin generated via AWS Bedrock
  const { data: bulletin, isLoading: isBulletinLoading } = useSWR(
    explanation ? ['bulletin', explanation.block_id, extraDays] : null,
    () => explanation ? fetchBlockBulletin(explanation.block_id, extraDays) : null,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading explanation...</div>;
  }

  if (!explanation) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center h-full text-gray-500">
        <p>Select a block on the map to view detailed risk factors.</p>
      </div>
    );
  }

  const renderIndicator = (ind: IndicatorDetail) => (
    <div key={ind.name} className="py-2 flex items-center justify-between border-t border-gray-200 text-sm">
      <div className="flex-1 pr-4">
        <div className="font-medium text-gray-800">{ind.name}</div>
        <div className="text-xs text-gray-500">W: {(ind.weight * 100).toFixed(0)}% • {formatNumber(ind.raw_value)} {ind.unit}</div>
      </div>
      <div className="w-24 text-right flex flex-col items-end">
        <DataBadge type={ind.data_type} />
        <div className="h-1.5 w-full bg-gray-200 mt-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${ind.normalized * 100}%` }} />
        </div>
      </div>
    </div>
  );

  const getBandColor = (band: string) => {
    switch (band) {
      case 'Low': return '#22c55e';
      case 'Moderate': return '#eab308';
      case 'High': return '#f97316';
      case 'Very High': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const bandColor = getBandColor(explanation.band);

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto pb-8">
      {/* Block Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">{explanation.block_name}</h2>
        <div className="text-gray-600 text-sm">{explanation.district} District</div>
        
        <div className="mt-4 flex items-end gap-3">
          <div className="text-5xl font-black tracking-tighter" style={{ color: bandColor }}>
            {formatNumber(explanation.hwsi, 3)}
          </div>
          <div className="pb-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold text-white uppercase shadow-sm" style={{ backgroundColor: bandColor }}>
              {explanation.band}
            </span>
            <div className="text-sm font-medium mt-1 text-gray-700">Rank: {explanation.rank} of {explanation.total_blocks}</div>
          </div>
        </div>
        
        {explanation.stability_pct > 0 && (
          <div className="mt-4 inline-flex px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-100">
            Top-5 in {(explanation.stability_pct * 100).toFixed(0)}% of sensitivity runs
          </div>
        )}
      </div>

      {/* Emergency Dispatch Card */}
      <div className="mb-6 rounded-lg border border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-amber-200/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold tracking-wide uppercase text-amber-900">
              Emergency Dispatch
            </span>
          </div>
        </div>

        {isBulletinLoading ? (
          <div className="py-4 text-center text-xs text-amber-700 flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            Synthesizing bilingual field directives...
          </div>
        ) : bulletin ? (
          <div className="space-y-3">
            {/* English Directive */}
            <div className="bg-white/90 rounded border border-amber-100 p-2.5">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>District Administration (DDMA / BDO)</span>
              </div>
              <p className="text-xs text-gray-800 leading-relaxed font-sans">
                {bulletin.bulletin_en}
              </p>
            </div>

            {/* Bengali Directive */}
            <div className="bg-white/90 rounded border border-amber-100 p-2.5">
              <div className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>বাংলা নির্দেশিকা (Panchayat & Field Workers)</span>
              </div>
              <p className="text-xs text-gray-900 leading-relaxed font-sans font-medium">
                {bulletin.bulletin_bn}
              </p>
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-end pt-1">
              <span className="text-[10px] text-gray-500 font-mono">
                {bulletin.source.toLowerCase().includes('bedrock') ? 'Live Bedrock' : 'Resilient Fallback'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic py-2">
            No bulletin generated. Select another block or refresh.
          </div>
        )}
      </div>

      {/* Accordion Components */}
      <Accordion.Root type="multiple" className="space-y-3">
        <Accordion.Item value="heat" className="border rounded-md bg-white overflow-hidden shadow-sm">
          <Accordion.Header>
            <Accordion.Trigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
              <div className="flex flex-col text-left">
                <span className="font-bold text-red-600">Heat Profile</span>
                <span className="text-xs text-gray-500">Score: {formatNumber(explanation.components.h.score, 3)} • W: {(explanation.components.h.weight * 100).toFixed(0)}%</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-data-[state=open]:rotate-180 transition-transform duration-200" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-4 pb-4 pt-1 bg-gray-50 border-t">
            <p className="text-sm mb-3 text-gray-700">{explanation.heat_summary}</p>
            {explanation.components.h.indicators.map(renderIndicator)}
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="water" className="border rounded-md bg-white overflow-hidden shadow-sm">
          <Accordion.Header>
            <Accordion.Trigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
              <div className="flex flex-col text-left">
                <span className="font-bold text-blue-600">Water Profile</span>
                <span className="text-xs text-gray-500">Score: {formatNumber(explanation.components.e.score, 3)} • W: {(explanation.components.e.weight * 100).toFixed(0)}%</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-data-[state=open]:rotate-180 transition-transform duration-200" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-4 pb-4 pt-1 bg-gray-50 border-t">
            <p className="text-sm mb-3 text-gray-700">{explanation.water_summary}</p>
            {explanation.components.e.indicators.map(renderIndicator)}
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="people" className="border rounded-md bg-white overflow-hidden shadow-sm">
          <Accordion.Header>
            <Accordion.Trigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
              <div className="flex flex-col text-left">
                <span className="font-bold text-amber-600">Vulnerability</span>
                <span className="text-xs text-gray-500">Score: {formatNumber(explanation.components.v.score, 3)} • W: {(explanation.components.v.weight * 100).toFixed(0)}%</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-data-[state=open]:rotate-180 transition-transform duration-200" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-4 pb-4 pt-1 bg-gray-50 border-t">
            <p className="text-sm mb-3 text-gray-700">{explanation.people_summary}</p>
            {explanation.components.v.indicators.map(renderIndicator)}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}
