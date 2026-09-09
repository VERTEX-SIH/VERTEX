import httpx

# Ensure httpx clients created by google-genai SDK don't fail SSL verification on Windows
_original_sync_init = httpx.Client.__init__
httpx.Client.__init__ = lambda self, *args, **kwargs: _original_sync_init(self, *args, **{**kwargs, 'verify': False})
_original_async_init = httpx.AsyncClient.__init__
httpx.AsyncClient.__init__ = lambda self, *args, **kwargs: _original_async_init(self, *args, **{**kwargs, 'verify': False})

from google import genai
from pydantic import ValidationError
import json
import logging
from config import settings
from models.hotspot import FIRMSHotspot
from models.classification import OSMContext, ClassificationResult, ClassificationEnum

logger = logging.getLogger(__name__)


client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def classify_with_gemini(hotspot: FIRMSHotspot, osm_context: OSMContext) -> ClassificationResult:
    prompt = f"""
    Analyze the following fire/hotspot event and classify it into one of these categories:
    INDUSTRIAL_FIRE, PERSISTENT_INDUSTRIAL_SOURCE, GAS_FLARE, WILDFIRE_FOREST_FIRE, AGRICULTURAL_BURN, MINING_THERMAL_ACTIVITY, OTHER_THERMAL_ANOMALY, UNKNOWN_UNCERTAIN.
    
    Hotspot Data:
    - Latitude: {hotspot.latitude}
    - Longitude: {hotspot.longitude}
    - FRP (Fire Radiative Power): {hotspot.frp} MW
    - Confidence: {hotspot.confidence}
    - Day/Night: {hotspot.daynight}
    - Acquisition Date/Time: {hotspot.acq_date} {hotspot.acq_time}
    - Satellite/Instrument: {hotspot.satellite} {hotspot.instrument}
    
    OSM Context (nearby features) - Source: {osm_context.osm_source}:
    - Nearest industrial facility type: {osm_context.nearest_facility_type}
    - Distance to nearest industrial facility: {osm_context.nearest_facility_distance} meters
    - Total industrial facilities in 5km: {osm_context.facility_count_in_radius}
    - Local land use context (2km radius): {', '.join(osm_context.land_use_context) if osm_context.land_use_context else 'None identified'}
    - Nearby water context: {', '.join(osm_context.water_context) if osm_context.water_context else 'None identified'}
    - Hotspot within/very near mapped water feature: {osm_context.near_water}
    
    Rules:
    - High FRP and very close proximity (<500m) to a refinery/power plant/flare strongly suggests GAS_FLARE.
    - Low FRP, persistent and close proximity to an industrial facility strongly suggests PERSISTENT_INDUSTRIAL_SOURCE.
    - Accidental or structural fires at industrial zones are INDUSTRIAL_FIRE.
    - Only use AGRICULTURAL_BURN when the hotspot location is plausibly on/adjacent to cultivated land. A mapped river, reservoir, lake, canal, or other water feature within the immediate context is strong negative evidence against labeling the hotspot as an agricultural burn by proximity alone.
    - If forest/wood nearby, WILDFIRE_FOREST_FIRE.
    - If near coal field or mining operations, MINING_THERMAL_ACTIVITY.
    - Note that proximity alone is not proof; consider FRP and time (e.g. night flares).
    
    Return a JSON response with exactly this structure:
    {{
      "classification": "...",
      "confidence_score": 0.9,
      "explanation": "...",
      "evidence": ["...", "..."],
      "risk_level": "LOW", // Can be LOW, MODERATE, HIGH, CRITICAL
      "source_data": {{"model": "{settings.GEMINI_MODEL}"}}
    }}
    """
    
    try:
        import asyncio
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )
        
        data = json.loads(response.text)
        
        return ClassificationResult(
            classification=ClassificationEnum(data.get("classification", "UNKNOWN_UNCERTAIN")),
            confidence_score=float(data.get("confidence_score", 0.5)),
            explanation=str(data.get("explanation", "Could not fully parse reasoning.")),
            evidence=data.get("evidence", []),
            risk_level=data.get("risk_level", "LOW"),
            source_data=data.get("source_data", {"model": settings.GEMINI_MODEL})
        )
        
    except Exception as e:
        logger.error(f"Gemini classification error: {e}")
        return ClassificationResult(
            classification=ClassificationEnum.UNKNOWN_UNCERTAIN,
            confidence_score=0.1,
            explanation=f"Error calling LLM: {str(e)}",
            evidence=[],
            risk_level="LOW",
            source_data={"error": str(e)}
        )
