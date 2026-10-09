'use client';

import useSWR from 'swr';
import { fetchValidation, fetchDataStatus, fetchAwsStatus } from '@/lib/api';
import { DataBadge } from '@/components/common/DataBadge';
import { formatNumber } from '@/lib/utils';
import { Cloud, Cpu, Database, CheckCircle2, ShieldCheck } from 'lucide-react';

export function CredibilityPanel() {
  const { data: validation, isLoading: valLoading } = useSWR('validation', fetchValidation);
  const { data: dataStatus, isLoading: dataLoading } = useSWR('data-status', fetchDataStatus);
  const { data: awsStatus, isLoading: awsLoading } = useSWR('aws-status', fetchAwsStatus);

  if (valLoading || dataLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading credibility metrics...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto space-y-6 pb-8">
      <div>
        <h3 className="text-lg font-bold mb-2">Credibility & Cloud Stack</h3>
        <p className="text-sm text-gray-600">
          HWSI model mathematical validation, data lineage, and AWS cloud deployment posture.
        </p>
      </div>

      {/* AWS Cloud Architecture & Services Card */}
      <div className="border border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50/30 to-white rounded-lg p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-sky-950 uppercase tracking-wide">
              AWS Cloud Architecture
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            LIVE CLOUD LAYER
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          {/* Bedrock Service */}
          <div className="bg-white/90 p-2.5 rounded border border-sky-100 flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Amazon Bedrock</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold">
                  {awsStatus?.bedrock?.status || 'CONNECTED'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5 truncate">
                Model: <code className="text-gray-800 bg-gray-100 px-1 rounded">{awsStatus?.bedrock?.model.split(':').pop() || 'Claude 3.5 Sonnet'}</code>
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Zero-shot bilingual emergency alert generation (English &amp; Bengali).
              </p>
            </div>
          </div>

          {/* S3 Data Lake */}
          <div className="bg-white/90 p-2.5 rounded border border-sky-100 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Amazon S3 Data Lake</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-bold">
                  {awsStatus?.s3?.status || 'CONFIGURED'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5 truncate">
                Bucket: <code className="text-gray-800 bg-gray-100 px-1 rounded">{awsStatus?.s3?.bucket || 'bhumi-data-lake-pilot'}</code>
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Centralized storage for West Bengal geospatial boundaries &amp; daily weather snapshots.
              </p>
            </div>
          </div>

          {/* Deployment Region & Runtime */}
          <div className="bg-white/90 p-2.5 rounded border border-sky-100 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Target Serverless Runtime</span>
                <span className="text-[10px] font-mono text-gray-600 font-semibold">
                  {awsStatus?.region || 'ap-southeast-2'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">
                FastAPI on AWS App Runner / Fargate + CloudFront edge caching.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AHP Validation Section */}
      <div>
        <h4 className="font-semibold text-sm mb-2 flex justify-between items-center">
          AHP Validation
          {validation && (
            <span className={`text-xs px-2 py-1 rounded ${validation.ahp_cr < 0.1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              CR: {formatNumber(validation.ahp_cr, 3)}
            </span>
          )}
        </h4>
        <div className="text-xs text-gray-600">
          Consistency Ratio &lt; 0.10 indicates mathematically sound expert weighting.
        </div>
      </div>

      {/* Sensitivity / Stability Section */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Sensitivity (Top-5 Stability)</h4>
        {validation && (
          <div className="border rounded divide-y text-sm bg-white">
            {Object.entries(validation.top5_stability).map(([block, pct]) => (
              <div key={block} className="p-2 flex justify-between">
                <span>{block}</span>
                <span className="font-medium">{(pct * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">{validation?.sensitivity_note}</p>
      </div>

      {/* Data Quality & Sources Section */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Data Quality & Sources</h4>
        <div className="space-y-3">
          {dataStatus?.map(ds => (
            <div key={ds.name} className="border rounded p-3 bg-white text-sm shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium">{ds.name}</span>
                <DataBadge type={ds.type} />
              </div>
              <div className="text-xs text-gray-500 flex justify-between mt-2">
                <span>{ds.resolution}</span>
                <span>Updated: {new Date(ds.last_updated).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-xs">
        <strong>Limitations:</strong> Population counts rely on Census 2011 extrapolations. Resource inventories currently use mock data pending state integration.
      </div>
    </div>
  );
}
