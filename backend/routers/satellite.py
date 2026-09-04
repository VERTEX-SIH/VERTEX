from fastapi import APIRouter, Query, HTTPException
from services.satellite_service import get_sentinel2_context

router = APIRouter(prefix="/satellite", tags=["Satellite Evidence"])

@router.get("/evidence")
async def satellite_evidence(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    acq_date: str = Query(...),
):
    try:
        return await get_sentinel2_context(latitude, longitude, acq_date)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sentinel-2 request failed: {exc}")
