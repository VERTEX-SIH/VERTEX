import base64
import logging
import math
import time
import zlib
from datetime import date, timedelta
from typing import Optional, Dict, Any
import httpx
from config import settings

logger = logging.getLogger(__name__)

TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"
_token: Optional[str] = None
_token_expires_at: float = 0.0


def _is_image_empty_or_black(content: bytes) -> bool:
    """Check if PNG content is empty, invalid, or pitch black (no satellite pass in window)."""
    if not content or len(content) < 2500:
        return True
    try:
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            return False
        chunks = []
        offset = 8
        content_len = len(content)
        while offset < content_len - 12:
            chunk_len = int.from_bytes(content[offset:offset + 4], "big")
            chunk_type = content[offset + 4:offset + 8]
            if chunk_type == b"IDAT":
                chunks.append(content[offset + 8:offset + 8 + chunk_len])
            offset += 12 + chunk_len
        if not chunks:
            return True
        decompressed = zlib.decompress(b"".join(chunks))
        # If all decompressed bytes are <= 5, it is pitch black with no visible terrain
        return max(decompressed) <= 5
    except Exception:
        return len(content) < 5000


def _date_window(observation_date: str) -> tuple[str, str]:
    try:
        d = date.fromisoformat(observation_date)
    except Exception:
        d = date.today()
    return (d - timedelta(days=4)).isoformat(), (d + timedelta(days=1)).isoformat()


def _get_esri_tile_url(lat: float, lon: float, zoom: int = 15) -> str:
    """Generate Esri World Imagery satellite tile URL instantly without network blocking."""
    clamp_lat = max(-85.0511, min(85.0511, lat))
    clamp_lon = max(-180.0, min(180.0, lon))
    n = 2.0 ** zoom
    xtile = int((clamp_lon + 180.0) / 360.0 * n)
    lat_rad = math.radians(clamp_lat)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1.0 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return f"https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{ytile}/{xtile}"


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


async def get_sentinel2_context(lat: float, lon: float, obs_date: str) -> Dict[str, Any]:
    global _token_expires_at
    """Fetch a Sentinel-2 L2A true-colour preview around a FIRMS hotspot with instant Esri fallback."""
    start, end = _date_window(obs_date)
    fallback_url = _get_esri_tile_url(lat, lon)

    if settings.CDSE_CLIENT_ID and settings.CDSE_CLIENT_SECRET:
        delta = 0.015
        bbox = [lon - delta, lat - delta, lon + delta, lat + delta]
        evalscript = """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B12", "B11", "B08", "B04", "B03", "B02", "dataMask"] }],
    output: { bands: 4, sampleType: "AUTO" }
  };
}
function evaluatePixel(s) {
  let r = 3.5 * s.B12 + 0.8 * s.B04;
  let g = 1.8 * s.B08 + 0.4 * s.B03;
  let b = 1.2 * s.B04 + 0.4 * s.B02;
  return [r, g, b, s.dataMask];
}
"""
        body = {
            "input": {
                "bounds": {"bbox": bbox, "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}},
                "data": [{
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {"from": f"{start}T00:00:00Z", "to": f"{end}T23:59:59Z"},
                        "maxCloudCoverage": 80,
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
        # Ultra-tight 2.5 second timeout to prevent frontend image blanking
        timeout = httpx.Timeout(2.5, connect=1.5)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                token = await _get_token(client)
                r = await client.post(PROCESS_URL, json=body, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
                if r.status_code == 401:
                    _token_expires_at = 0
                    token = await _get_token(client)
                    r = await client.post(PROCESS_URL, json=body, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
                if r.status_code == 200 and r.content:
                    if _is_image_empty_or_black(r.content):
                        logger.info(
                            f"Sentinel-2 scene for ({lat}, {lon}) returned empty/black pixel data. "
                            "Falling back to Esri High-Resolution World Imagery."
                        )
                    else:
                        b64 = base64.b64encode(r.content).decode("ascii")
                        return {
                            "available": True,
                            "source": "Sentinel-2 SWIR Thermal Combustion Composite",
                            "acquisition_window": {"from": start, "to": end},
                            "center": {"latitude": lat, "longitude": lon},
                            "image_base64": b64,
                            "image_data_url": f"data:image/png;base64,{b64}",
                            "mime_type": "image/png",
                        }
        except Exception as exc:
            logger.warning(f"Sentinel-2 CDSE fetch fast-fallback to Esri: {exc}")

    # Instant Fallback to Esri High-Resolution World Imagery Tile
    return {
        "available": True,
        "source": "Esri High-Resolution World Imagery",
        "acquisition_window": {"from": start, "to": end},
        "center": {"latitude": lat, "longitude": lon},
        "image_data_url": fallback_url,
        "mime_type": "image/jpeg",
    }


