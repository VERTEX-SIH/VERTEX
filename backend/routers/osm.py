from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from services.osm_service import enrich_hotspot, query_overpass
from services.facility_service import find_nearby_facilities
from db.supabase_client import supabase_service
from models.hotspot import FIRMSHotspot
from typing import Optional, List
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/osm", tags=["OpenStreetMap"])

class EnrichTop50Request(BaseModel):
    hotspot_ids: Optional[List[str]] = None

def _synthetic_to_hotspot(value: str) -> Optional[FIRMSHotspot]:
    parts = str(value).split("-")
    if len(parts) < 5 or parts[0].lower() != "firms":
        return None
    try:
        lat, lon = float(parts[1]), float(parts[2])
        return FIRMSHotspot(latitude=lat, longitude=lon, acq_date=parts[3], acq_time=parts[4])
    except (ValueError, TypeError):
        return None

@router.get("/industrial")
async def get_industrial(lat: float = Query(...), lon: float = Query(...), radius: int = Query(1000)):
    live_facilities = await query_overpass(lat, lon, radius)
    if live_facilities is not None:
        return {"facilities": live_facilities, "source": "LIVE", "query_status": "SUCCESS"}
    offline_facilities = find_nearby_facilities(lat, lon, radius)
    return {"facilities": offline_facilities, "source": "OFFLINE_CATALOG", "query_status": "SUCCESS"}

@router.get("/health")
async def check_osm_health():
    return {"mirrors": [{"mirror": "overpass", "status": "AVAILABLE"}]}

async def _enrich_one_hotspot(hotspot_id: str):
    hotspot_data = None
    try:
        res = supabase_service.table("hotspots").select("*").eq("id", hotspot_id).limit(1).execute()
        if res.data:
            hotspot_data = res.data[0]
    except Exception as e:
        logger.warning(f"Stored hotspot lookup failed for {hotspot_id}: {e}")
    if hotspot_data:
        hotspot = FIRMSHotspot(**hotspot_data)
    else:
        hotspot = _synthetic_to_hotspot(hotspot_id)
        if hotspot is None:
            raise HTTPException(status_code=404, detail="Hotspot not found")

    osm_context = await asyncio.wait_for(enrich_hotspot(hotspot), timeout=120.0)
    osm_data = {
        "nearby_facilities": osm_context.nearby_facilities,
        "nearest_facility_distance": osm_context.nearest_facility_distance,
        "nearest_facility_type": osm_context.nearest_facility_type,
        "facility_count_in_radius": osm_context.facility_count_in_radius,
        "land_use_context": osm_context.land_use_context,
        "osm_source": osm_context.osm_source,
    }
    if hotspot_data:
        try:
            supabase_service.table("classifications").update({"osm_context": osm_data}).eq("hotspot_id", hotspot_id).execute()
        except Exception as e:
            logger.warning(f"Could not persist OSM context for {hotspot_id}: {e}")
    return osm_context

@router.post("/enrich/{hotspot_id}")
async def manual_enrich_hotspot(hotspot_id: str):
    try:
        return await _enrich_one_hotspot(hotspot_id)
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="OSM enrichment timed out")
    except Exception as e:
        logger.exception("OSM enrichment failed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enrich/top50")
async def enrich_top50(request: EnrichTop50Request = EnrichTop50Request()):
    if request.hotspot_ids is not None:
        ids = [str(v) for v in request.hotspot_ids][:50]
    else:
        res = supabase_service.table("hotspots").select("id,frp").order("frp", desc=True).limit(50).execute()
        ids = [str(r.get("id")) for r in (res.data or []) if r.get("id") is not None]
    results = []
    for hotspot_id in ids:
        try:
            context = await _enrich_one_hotspot(hotspot_id)
            results.append({"hotspot_id": hotspot_id, "status": "ok", "context": context.model_dump(mode="json")})
        except Exception as e:
            results.append({"hotspot_id": hotspot_id, "status": "error", "error": str(e)})
    return {"processed": len(results), "results": results}
