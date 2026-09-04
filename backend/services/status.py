from config import settings

service_status = {
    "firms": {"status": "NOMINAL", "last_success": None},
    "osm": {"status": "UNKNOWN", "source": "NOT_CHECKED"},
    "facility_data": {"status": "NOMINAL", "source": "SUPABASE CATALOG"},
    "gemini": {"status": "NOMINAL" if settings.GEMINI_API_KEY else "DEGRADED", "model": settings.GEMINI_MODEL},
    "database": {"status": "UNKNOWN"},
}
