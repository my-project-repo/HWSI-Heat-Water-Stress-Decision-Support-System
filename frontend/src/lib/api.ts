import { API_BASE_URL } from './constants';
import type { 
  BlockRisk, 
  BlockExplanation, 
  AllocationRequest, 
  AllocationResponse,
  DataSource,
  ValidationResult 
} from './types';

export async function fetchRiskIndex(extraDays: number = 0): Promise<BlockRisk[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/blocks/risk-index`);
  if (extraDays > 0) {
    url.searchParams.append('extra_days', extraDays.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch risk index');
  return res.json();
}

export async function fetchBlockExplanation(blockId: string, extraDays: number = 0): Promise<BlockExplanation> {
  const url = new URL(`${API_BASE_URL}/api/v1/blocks/${blockId}/explain`);
  if (extraDays > 0) {
    url.searchParams.append('extra_days', extraDays.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch explanation for ${blockId}`);
  return res.json();
}

export async function postAllocation(request: AllocationRequest): Promise<AllocationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to compute allocation');
  return res.json();
}

export async function fetchDataStatus(): Promise<DataSource[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/data-status`);
  if (!res.ok) throw new Error('Failed to fetch data status');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.sources || []);
}

export async function fetchValidation(): Promise<ValidationResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/validation`);
  if (!res.ok) throw new Error('Failed to fetch validation data');
  return res.json();
}

export async function fetchBlockBulletin(blockId: string, extraDays: number = 0): Promise<import('./types').EmergencyBulletin> {
  const url = new URL(`${API_BASE_URL}/api/v1/blocks/${blockId}/bulletin`);
  if (extraDays > 0) {
    url.searchParams.append('extra_days', extraDays.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch bulletin for ${blockId}`);
  return res.json();
}

export async function fetchAwsStatus(): Promise<import('./types').AwsStatus> {
  const res = await fetch(`${API_BASE_URL}/api/v1/aws-status`);
  if (!res.ok) throw new Error('Failed to fetch AWS status');
  return res.json();
}

