import math
import logging
from typing import List, Dict, Any
from db.supabase_client import supabase_service

logger = logging.getLogger(__name__)

# Basic in-memory cache to prevent downloading all facilities constantly
_cached_facilities: List[Dict[str, Any]] = []

def _get_all_facilities() -> List[Dict[str, Any]]:
    global _cached_facilities
    if _cached_facilities:
        return _cached_facilities
        
    try:
        res = supabase_service.table('industrial_facilities').select('*').execute()
        if res.data:
            _cached_facilities = res.data
            return _cached_facilities
    except Exception as e:
        logger.error(f'Error fetching facilities from Supabase: {e}')
    
    return []

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000  # radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def find_nearby_facilities(lat: float, lon: float, radius_m: int = 5000) -> List[Dict[str, Any]]:
    facilities = _get_all_facilities()
    if not facilities:
        return []
        
    nearby = []
    for fac in facilities:
        effective_radius = fac.get('radius_m')
        if effective_radius is None:
            effective_radius = radius_m
            
        dist = haversine_distance(lat, lon, fac['latitude'], fac['longitude'])
        if dist <= effective_radius:
            nearby.append({
                'name': fac['name'],
                'type': fac['type'],
                'latitude': fac['latitude'],
                'longitude': fac['longitude'],
                'distance_m': round(dist, 2)
            })
            
    # Sort by nearest first
    nearby.sort(key=lambda x: x['distance_m'])
    return nearby
