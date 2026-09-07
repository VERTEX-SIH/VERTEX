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
    assert _point_in_india(20.5937, 78.9629)  # Nagpur (Central)
    assert _point_in_india(34.0837, 74.7973)  # Srinagar (J&K)
    assert _point_in_india(34.1526, 77.5771)  # Leh (Ladakh)
    assert _point_in_india(37.0900, 76.7900)  # Indira Col (Ladakh)
    assert _point_in_india(27.0844, 93.6053)  # Itanagar (Arunachal Pradesh)
    assert _point_in_india(11.6234, 92.7265)  # Port Blair (Andaman & Nicobar)
    assert _point_in_india(10.5669, 72.6420)  # Kavaratti (Lakshadweep)
    assert _point_in_india(23.6892, 68.5292)  # Koteshwar (Gujarat coast)
    assert _point_in_india(19.4000, 71.3000)  # Bombay High (Offshore energy)
    assert not _point_in_india(31.5204, 74.3587)  # Lahore (Pakistan)
    assert not _point_in_india(23.8103, 90.4125)  # Dhaka (Bangladesh)


def test_find_nearby_facilities_unique_distances_under_800m():
    from services.facility_service import find_nearby_facilities
    test_points = [
        (15.16888, 76.67051),
        (19.07600, 72.87700),
        (13.08200, 80.27000),
        (28.61300, 77.20900),
        (20.59300, 78.96200),
        (34.08300, 74.79700),
    ]
    distances = []
    for lat, lon in test_points:
        nearby = find_nearby_facilities(lat, lon, radius_m=800)
        assert len(nearby) > 0
        d = nearby[0]["distance_m"]
        assert d < 800.0, f"Distance {d} exceeds 800m"
        assert d != 950.0, "Distance should not be hardcoded 950.0"
        distances.append(d)

    # Ensure distances across different locations are distinct
    assert len(set(distances)) == len(distances), "Distances across locations should be unique"
