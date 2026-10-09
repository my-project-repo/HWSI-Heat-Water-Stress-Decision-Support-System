import time
import threading
from fastapi import APIRouter, Request
from app.models import AllocationRequest, AllocationResponse, AllocationResult, BlockAllocation
from app.optimizer.allocator import optimize_allocation
from app.optimizer.baselines import compute_baselines
from app.engine.hwsi import get_scenario_hwsi_df
from app.services.aws_service import upload_snapshot_to_s3

router = APIRouter()

def build_allocations(tanker_allocs, cooling_allocs, df):
    block_map = {row['block_id']: row for _, row in df.iterrows()}
    res = []
    
    # Calculate need scores for display
    for b_id, row in block_map.items():
        t_count = tanker_allocs.get(b_id, 0)
        c_count = cooling_allocs.get(b_id, 0)
        
        if t_count > 0 or c_count > 0:
            need_val = float(row.get('hwsi_score', 0.5))
            pop_val = float(row.get('total_population', 150000))
            district_val = str(row.get('district', ''))
            name_val = str(row.get('block_name', b_id))
            
            # Meaningful plain-text rationale
            rationale_parts = []
            if t_count > 0:
                rationale_parts.append(f"{t_count} tankers for high water deficit")
            if c_count > 0:
                rationale_parts.append(f"{c_count} cooling units for extreme heat vulnerability")
            rationale = "; ".join(rationale_parts) + ". Next unit maximizes marginal population benefit."
            
            res.append(BlockAllocation(
                block_id=b_id,
                block_name=name_val,
                district=district_val,
                tankers=int(t_count),
                cooling_units=int(c_count),
                need_score=round(need_val, 3),
                population=pop_val,
                rationale=rationale
            ))
            
    # Sort by total units allocated descending, then by need_score
    res.sort(key=lambda x: (x.tankers + x.cooling_units, x.need_score), reverse=True)
    return res

@router.post("/api/v1/allocate", response_model=AllocationResponse)
def allocate_resources(request: Request, body: AllocationRequest):
    df = get_scenario_hwsi_df(request.app.state, body.extra_days or 0)
    if df is None:
        df = request.app.state.hwsi_df
    
    # Run optimizer for both tankers and cooling units
    opt_tankers = optimize_allocation(df, "tankers", body.tankers)
    opt_cooling = optimize_allocation(df, "cooling_units", body.cooling_units)
    
    base_tankers = compute_baselines(df, "tankers", body.tankers)
    base_cooling = compute_baselines(df, "cooling_units", body.cooling_units)
    
    opt_allocs = build_allocations(opt_tankers["allocations"], opt_cooling["allocations"], df)
    base_hwsi_allocs = build_allocations(base_tankers["highest_hwsi"]["allocations"], base_cooling["highest_hwsi"]["allocations"], df)
    base_prop_allocs = build_allocations(base_tankers["proportional"]["allocations"], base_cooling["proportional"]["allocations"], df)
    
    total_opt_coverage = float(opt_tankers["total_benefit_covered"] + opt_cooling["total_benefit_covered"])
    total_hwsi_coverage = float(base_tankers["highest_hwsi"]["total_benefit_covered"] + base_cooling["highest_hwsi"]["total_benefit_covered"])
    total_prop_coverage = float(base_tankers["proportional"]["total_benefit_covered"] + base_cooling["proportional"]["total_benefit_covered"])
    
    response = AllocationResponse(
        optimizer=AllocationResult(
            method="Marginal Benefit Optimizer",
            total_coverage=round(total_opt_coverage, 1),
            allocations=opt_allocs
        ),
        baseline_hwsi=AllocationResult(
            method="Highest HWSI First",
            total_coverage=round(total_hwsi_coverage, 1),
            allocations=base_hwsi_allocs
        ),
        baseline_proportional=AllocationResult(
            method="Proportional Allocation",
            total_coverage=round(total_prop_coverage, 1),
            allocations=base_prop_allocs
        )
    )

    # Archive run snapshot to AWS S3 Data Lake in background thread (sub-50ms instant UI response)
    snapshot_key = f"snapshots/allocations_tankers{body.tankers}_cooling{body.cooling_units}_{int(time.time())}.json"
    threading.Thread(
        target=upload_snapshot_to_s3,
        args=(response.dict(), snapshot_key),
        daemon=True
    ).start()

    return response
