import base64
import logging
import time
from datetime import date, timedelta
from typing import Optional, Dict, Any
import httpx
from config import settings

logger = logging.getLogger(__name__)

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"
_token: Optional[str] = None
_token_expires_at: float = 0.0


def _date_window(observation_date: str) -> tuple[str, str]:
    try:
        d = date.fromisoformat(observation_date)
    except Exception:
        d = date.today()
    return (d - timedelta(days=4)).isoformat(), (d + timedelta(days=1)).isoformat()


async def _get_token(client: httpx.AsyncClient) -> str:
    global _token, _token_expires_at
    if _token and time.time() < _token_expires_at - 60:
        return _token
    if not settings.CDSE_CLIENT_ID or not settings.CDSE_CLIENT_SECRET:
        raise RuntimeError("CDSE_CLIENT_ID/CDSE_CLIENT_SECRET are not configured")
    r = await client.post(
        TOKEN_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": settings.CDSE_CLIENT_ID,
            "client_secret": settings.CDSE_CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    r.raise_for_status()
    payload = r.json()
    _token = payload["access_token"]
    _token_expires_at = time.time() + int(payload.get("expires_in", 3600))
    return _token


async def get_sentinel2_context(lat: float, lon: float, obs_date: str) -> Optional[Dict[str, Any]]:
    global _token_expires_at
    """Fetch a small Sentinel-2 L2A true-colour preview around a FIRMS hotspot."""
    if not settings.CDSE_CLIENT_ID or not settings.CDSE_CLIENT_SECRET:
        logger.warning("CDSE credentials are not configured")
        return {"available": False, "reason": "CDSE credentials not configured"}

    start, end = _date_window(obs_date)
    delta = 0.012
    bbox = [lon - delta, lat - delta, lon + delta, lat + delta]
    evalscript = """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B03", "B02", "dataMask"] }],
    output: { bands: 4, sampleType: "AUTO" }
  };
}
function evaluatePixel(s) {
  return [2.5 * s.B04, 2.5 * s.B03, 2.5 * s.B02, s.dataMask];
}
"""
    body = {
        "input": {
            "bounds": {"bbox": bbox, "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}},
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {"from": f"{start}T00:00:00Z", "to": f"{end}T23:59:59Z"},
                    "maxCloudCoverage": 70,
                },
            }],
        },
        "output": {
            "width": 512,
            "height": 512,
            "responses": [{"identifier": "default", "format": {"type": "image/png"}}],
        },
        "evalscript": evalscript,
    }
    timeout = httpx.Timeout(45.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        token = await _get_token(client)
        r = await client.post(PROCESS_URL, json=body, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        if r.status_code == 401:
            _token_expires_at = 0
            token = await _get_token(client)
            r = await client.post(PROCESS_URL, json=body, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        r.raise_for_status()
        return {
            "available": True,
            "source": "Copernicus Sentinel-2 L2A",
            "acquisition_window": {"from": start, "to": end},
            "center": {"latitude": lat, "longitude": lon},
            "image_base64": base64.b64encode(r.content).decode("ascii"),
            "mime_type": "image/png",
        }
