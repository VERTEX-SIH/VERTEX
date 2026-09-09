from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from enum import Enum
from models.hotspot import FIRMSHotspot

class ClassificationEnum(str, Enum):
    INDUSTRIAL_FIRE = 'INDUSTRIAL_FIRE'
    PERSISTENT_INDUSTRIAL_SOURCE = 'PERSISTENT_INDUSTRIAL_SOURCE'
    GAS_FLARE = 'GAS_FLARE'
    WILDFIRE_FOREST_FIRE = 'WILDFIRE_FOREST_FIRE'
    AGRICULTURAL_BURN = 'AGRICULTURAL_BURN'
    MINING_THERMAL_ACTIVITY = 'MINING_THERMAL_ACTIVITY'
    OTHER_THERMAL_ANOMALY = 'OTHER_THERMAL_ANOMALY'
    UNKNOWN_UNCERTAIN = 'UNKNOWN_UNCERTAIN'
    UNKNOWN = 'UNKNOWN' # Keep for backwards compatibility if needed

class OSMSourceEnum(str, Enum):
    LIVE = 'LIVE'
    LIVE_NO_FACILITY = 'LIVE_NO_FACILITY'
    CACHED = 'CACHED'
    CACHED_NO_FACILITY = 'CACHED_NO_FACILITY'
    OFFLINE_CATALOG = 'OFFLINE_CATALOG'
    FAILED = 'FAILED'
    PENDING = 'PENDING'
    GEMINI_AI_IDENTIFIED = 'GEMINI_AI_IDENTIFIED'
    GEMINI_VERIFIED_NO_FACILITY = 'GEMINI_VERIFIED_NO_FACILITY'
    LIVE_GEMINI_ENRICHED = 'LIVE_GEMINI_ENRICHED'

class OSMContext(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    nearby_facilities: List[Dict[str, Any]] = []
    nearest_facility_distance: Optional[float] = None
    nearest_facility_type: Optional[str] = None
    facility_count_in_radius: int = 0
    land_use_context: List[str] = []
    water_context: List[str] = []
    near_water: bool = False
    osm_source: Any = OSMSourceEnum.PENDING

class ClassificationResult(BaseModel):
    classification: ClassificationEnum
    confidence_score: float
    explanation: str
    evidence: List[str]
    source_data: Dict[str, Any]
    risk_score: float = 0.0
    risk_level: str = 'LOW'

class ClassifiedHotspot(BaseModel):
    hotspot: FIRMSHotspot
    classification: ClassificationResult
    osm_context: OSMContext
