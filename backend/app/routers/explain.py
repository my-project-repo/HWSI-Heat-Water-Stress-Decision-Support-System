from fastapi import APIRouter, Request, HTTPException
from app.models import BlockExplanation, BlockComponents, ComponentDetail, IndicatorDetail
import app.config as config
from app.engine.ahp import get_weights_from_config
from app.engine.hwsi import get_scenario_hwsi_df
import pandas as pd

router = APIRouter()

INDICATOR_METADATA = {
    "heat_index": {"name": "Heat Index (Rothfusz)", "unit": "°C", "lens": "heat", "data_type": "LIVE"},
    "warm_nights": {"name": "Consecutive Warm Nights", "unit": "nights", "lens": "heat", "data_type": "LIVE"},
    "precip_deficit": {"name": "Rainfall Deficit", "unit": "%", "lens": "water", "data_type": "LIVE"},
    "et": {"name": "Cumulative Evapotranspiration", "unit": "mm", "lens": "water", "data_type": "LIVE"},
    "sm_slope": {"name": "Soil Moisture Drying Rate", "unit": "slope", "lens": "water", "data_type": "LIVE"},
    "tmin_ma": {"name": "Tmin 3-Day Moving Avg", "unit": "°C", "lens": "heat", "data_type": "LIVE"},
    "population_density": {"name": "Population Density", "unit": "per sq km", "lens": "both", "data_type": "STATIC"},
    "pct_outdoor_workers": {"name": "Outdoor Agricultural Workers", "unit": "%", "lens": "heat", "data_type": "STATIC"},
    "pct_piped_coverage": {"name": "Household Piped Water Coverage", "unit": "%", "lens": "water", "data_type": "PERIODIC"},
    "extraction_pct": {"name": "Groundwater Extraction Rate", "unit": "%", "lens": "water", "data_type": "PERIODIC"},
    "arsenic_affected": {"name": "Arsenic Contamination Status", "unit": "flag", "lens": "water", "data_type": "STATIC"},
    "fluoride_affected": {"name": "Fluoride Contamination Status", "unit": "flag", "lens": "water", "data_type": "STATIC"},
    "beds_per_1000": {"name": "Hospital Beds per 1,000", "unit": "beds/1k", "lens": "heat", "data_type": "MOCK"},
    "pct_elderly": {"name": "Elderly Population (65+)", "unit": "%", "lens": "heat", "data_type": "STATIC"},
    "pct_children": {"name": "Child Population (0-6)", "unit": "%", "lens": "heat", "data_type": "STATIC"},
}

@router.get("/api/v1/blocks/{block_id}/explain", response_model=BlockExplanation)
def explain_block(request: Request, block_id: str, extra_days: int = 0):
    df = get_scenario_hwsi_df(request.app.state, extra_days)
    if df is None:
        df = request.app.state.hwsi_df
    block_row = df[df['block_id'] == block_id]
    
    if block_row.empty:
        raise HTTPException(status_code=404, detail="Block not found")
        
    row = block_row.iloc[0]
    weights, _ = get_weights_from_config(config)
    w_comp = weights["components"]
    
    stability_dict = getattr(request.app.state, 'stability_map', {})
    stab_val = float(stability_dict.get(block_id, 0.75))
    
    component_details = {}
    all_indicators = []
    
    comp_map = {
        "h": ("hazard", w_comp[0]),
        "e": ("exposure", w_comp[1]),
        "v": ("vulnerability", w_comp[2])
    }
    
    for short_key, (full_comp, comp_weight) in comp_map.items():
        inds = config.INDICATOR_NAMES[full_comp]
        raw_w = weights[full_comp]
        norm_w = raw_w / raw_w.sum()
        
        comp_indicators = []
        for i, ind in enumerate(inds):
            meta = INDICATOR_METADATA.get(ind, {"name": ind, "unit": "", "lens": "both", "data_type": "STATIC"})
            raw_v = float(row[ind]) if ind in row and pd.notna(row[ind]) else 0.0
            norm_v = float(row[f"norm_{ind}"]) if f"norm_{ind}" in row and pd.notna(row[f"norm_{ind}"]) else 0.5
            w_val = float(norm_w[i]) if i < len(norm_w) else 0.0
            
            detail = IndicatorDetail(
                name=meta["name"],
                raw_value=raw_v,
                normalized=norm_v,
                weight=w_val,
                unit=meta["unit"],
                lens=meta["lens"],
                data_type=meta["data_type"],
                last_updated="Recent"
            )
            comp_indicators.append(detail)
            all_indicators.append(detail)
            
        comp_score = float(row[f"{full_comp}_score"])
        component_details[short_key] = ComponentDetail(
            score=comp_score,
            weight=float(comp_weight),
            indicators=comp_indicators
        )
    
    # Plain language summaries matching PRD §9
    heat_summary = f"{int(row.get('warm_nights', 2))} warm nights forecast with heat index {row.get('heat_index', 40.0):.1f}°C."
    water_summary = f"Piped water coverage at {row.get('pct_piped_coverage', 45):.1f}%, groundwater extraction {row.get('extraction_pct', 70):.1f}%."
    people_summary = f"Population density {row.get('population_density', 500):.0f}/km² with {row.get('pct_outdoor_workers', 35):.1f}% outdoor workers."

    return BlockExplanation(
        block_id=block_id,
        block_name=row['block_name'],
        district=row['district'],
        hwsi=float(row['hwsi_score']),
        band=row['risk_band'],
        rank=int(row['rank']),
        total_blocks=len(df),
        stability_pct=stab_val,
        components=BlockComponents(
            h=component_details["h"],
            e=component_details["e"],
            v=component_details["v"]
        ),
        heat_summary=heat_summary,
        water_summary=water_summary,
        people_summary=people_summary,
        indicators=all_indicators,
        # Backward compatibility
        hwsi_score=float(row['hwsi_score']),
        data_freshness="Updated 1 hour ago",
        rationale=f"{heat_summary} {water_summary}"
    )

from app.services.aws_service import generate_bilingual_bulletin, get_aws_status

@router.get("/api/v1/blocks/{block_id}/bulletin")
async def get_block_bulletin(request: Request, block_id: str, extra_days: int = 0):
    df = get_scenario_hwsi_df(request.app.state, extra_days)
    if df is None:
        df = request.app.state.hwsi_df
    block_row = df[df['block_id'] == block_id]
    if block_row.empty:
        raise HTTPException(status_code=404, detail="Block not found")
    row = block_row.iloc[0]
    block_data = {
        "block_id": block_id,
        "block_name": row["block_name"],
        "district": row["district"],
        "hwsi": float(row["hwsi_score"]),
        "band": str(row["risk_band"]),
        "rank": int(row["rank"]),
        "heat_hazard": float(row.get("heat_hazard", 0.5)),
        "water_stress": float(row.get("water_stress", 0.5)),
        "heat_index": float(row.get("heat_index", 40.0)),
        "warm_nights": int(row.get("warm_nights", 2)),
        "pct_piped_coverage": float(row.get("pct_piped_coverage", 45.0)),
        "tankers": 3 if str(row["risk_band"]) in ["High", "Very High"] else 1,
        "cooling_units": 2 if str(row["risk_band"]) in ["High", "Very High"] else 1
    }
    bulletin = await generate_bilingual_bulletin(block_data)
    return {
        "block_id": block_id,
        "block_name": row["block_name"],
        "district": row["district"],
        "hwsi": float(row["hwsi_score"]),
        "band": str(row["risk_band"]),
        "rank": int(row["rank"]),
        **bulletin
    }

@router.get("/api/v1/aws-status")
def get_aws_cloud_status():
    return get_aws_status()

