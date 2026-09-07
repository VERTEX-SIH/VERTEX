import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from config import settings
from services.firms_service import _point_in_india
from services.osm_service import _is_valid_live_context
from models.classification import OSMContext


def test_gemini_model_default_or_configured():
    assert settings.GEMINI_MODEL == "gemini-2.0-flash" or settings.GEMINI_MODEL

def test_osm_zero_facility_context_valid():
    assert _is_valid_live_context(OSMContext(nearby_facilities=[], osm_source="LIVE_NO_FACILITY"))
    assert _is_valid_live_context(OSMContext(nearby_facilities=[], osm_source="CACHED_NO_FACILITY"))

def test_india_boundary_point():
    assert _point_in_india(20.5937, 78.9629)


def test_find_nearby_facilities_no_clamp_and_no_false_fallback():
    from services.facility_service import find_nearby_facilities
    # UltraTech Rajashree Cement is at lat 17.15, lon 77.10
    # A point 300m away
    lat_near = 17.15 + (300 / 111000)
    lon_near = 77.10
    nearby = find_nearby_facilities(lat_near, lon_near, radius_m=1000)
    assert len(nearby) > 0
    assert nearby[0]["distance_m"] < 900
    assert nearby[0]["distance_m"] != 950.0

    # A remote point in the middle of the Indian Ocean or far from any industrial facility
    far_results = find_nearby_facilities(10.0, 70.0, radius_m=1000)
    assert far_results == []

