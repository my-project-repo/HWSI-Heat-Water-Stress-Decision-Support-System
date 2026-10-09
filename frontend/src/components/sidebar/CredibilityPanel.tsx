'use client';

import useSWR from 'swr';
import { fetchValidation, fetchDataStatus } from '@/lib/api';
import { DataBadge } from '@/components/common/DataBadge';
import { formatNumber } from '@/lib/utils';

export function CredibilityPanel() {
  const { data: validation, isLoading: valLoading } = useSWR('validation', fetchValidation);
  const { data: dataStatus, isLoading: dataLoading } = useSWR('data-status', fetchDataStatus);

  if (valLoading || dataLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading credibility metrics...</div>;
  }

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto space-y-6 pb-8">
      <div>
        <h3 className="text-lg font-bold mb-2">Credibility & Quality</h3>
        <p className="text-sm text-gray-600">
          HWSI model mathematical validation and data source lineage.
        </p>
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
