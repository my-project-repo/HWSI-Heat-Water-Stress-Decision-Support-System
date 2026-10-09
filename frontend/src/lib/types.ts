export interface BlockRisk {
  block_id: string;
  block_name: string;
  district: string;
  hwsi: number;
  band: 'Low' | 'Moderate' | 'High' | 'Very High';
  rank: number;
  h_score: number;
  e_score: number;
  v_score: number;
  heat_hazard: number;
  water_stress: number;
  stability_pct: number;
}

export interface BlockExplanation {
  block_id: string;
  block_name: string;
  district: string;
  hwsi: number;
  band: string;
  rank: number;
  total_blocks: number;
  stability_pct: number;
  components: { h: ComponentDetail; e: ComponentDetail; v: ComponentDetail };
  heat_summary: string;
  water_summary: string;
  people_summary: string;
  indicators: IndicatorDetail[];
}

export interface ComponentDetail {
  score: number;
  weight: number;
  indicators: IndicatorDetail[];
}

export interface IndicatorDetail {
  name: string;
  raw_value: number;
  normalized: number;
  weight: number;
  unit: string;
  lens: 'heat' | 'water' | 'both';
  data_type: 'LIVE' | 'STATIC' | 'PERIODIC' | 'MOCK';
  last_updated: string;
}

export interface AllocationRequest {
  tankers: number;
  cooling_units: number;
  extra_days?: number;
}

export interface AllocationResult {
  method: string;
  total_coverage: number;
  allocations: BlockAllocation[];
}

export interface BlockAllocation {
  block_id: string;
  block_name: string;
  district: string;
  tankers: number;
  cooling_units: number;
  need_score: number;
  population: number;
  rationale: string;
}

export interface AllocationResponse {
  optimizer: AllocationResult;
  baseline_hwsi: AllocationResult;
  baseline_proportional: AllocationResult;
}

export interface DataSource {
  name: string;
  type: 'LIVE' | 'STATIC' | 'PERIODIC' | 'MOCK';
  last_updated: string;
  resolution: string;
  source: string;
}

export interface ValidationResult {
  ahp_cr: number;
  top5_stability: Record<string, number>;
  sensitivity_note: string;
}

export interface EmergencyBulletin {
  block_id: string;
  block_name: string;
  district: string;
  hwsi: number;
  band: string;
  rank: number;
  bulletin_en: string;
  bulletin_bn: string;
  model: string;
  source: string;
  region: string;
}

export interface AwsStatus {
  region: string;
  bedrock: {
    status: string;
    model: string;
    auth_type: string;
    account_id: string;
  };
  s3: {
    status: string;
    bucket: string;
  };
  cloud_architecture: string;
}

