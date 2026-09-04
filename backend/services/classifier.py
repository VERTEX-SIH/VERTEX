import logging
from typing import List, Union
from models.hotspot import FIRMSHotspot
from models.classification import ClassifiedHotspot, ClassificationResult, ClassificationEnum, OSMContext, OSMSourceEnum
from services.firms_service import fetch_realtime_hotspots
from services.osm_service import enrich_hotspot
from services.gemini_service import classify_with_gemini

logger = logging.getLogger(__name__)

def calculate_risk_score(classification: ClassificationEnum, frp: float, dist: float, conf: str) -> tuple[float, str]:
    weights = {
        ClassificationEnum.INDUSTRIAL_FIRE: 0.9,
        ClassificationEnum.GAS_FLARE: 0.7,
        ClassificationEnum.WILDFIRE_FOREST_FIRE: 0.6,
        ClassificationEnum.PERSISTENT_INDUSTRIAL_SOURCE: 0.4,
        ClassificationEnum.MINING_THERMAL_ACTIVITY: 0.5,
        ClassificationEnum.AGRICULTURAL_BURN: 0.3,
        ClassificationEnum.OTHER_THERMAL_ANOMALY: 0.2,
        ClassificationEnum.UNKNOWN_UNCERTAIN: 0.1,
        ClassificationEnum.UNKNOWN: 0.1,
    }
    
    type_weight = weights.get(classification, 0.1)
    frp_norm = min(frp / 500.0, 1.0)
    
    dist_norm = 0.0
    if dist is not None and dist > 0:
        dist_norm = min(1000.0 / dist, 1.0) if dist >= 100 else 1.0
        
    conf_score = 0.5
    if conf in ('h', 'high', '100'):
        conf_score = 1.0
    elif conf in ('l', 'low', '0'):
        conf_score = 0.2
        
    score = (type_weight * 0.4 + frp_norm * 0.3 + dist_norm * 0.2 + conf_score * 0.1) * 100
    
    if score >= 80:
        return score, 'CRITICAL'
    elif score >= 60:
        return score, 'HIGH'
    elif score >= 40:
        return score, 'MODERATE'
    else:
        return score, 'LOW'

async def classify_hotspot_with_context(hotspot: FIRMSHotspot, osm_context: OSMContext) -> ClassifiedHotspot:
    frp = hotspot.frp or 0.0
    is_daytime = hotspot.daynight == 'D'
    
    nearest_dist = osm_context.nearest_facility_distance
    near_industry = nearest_dist is not None and nearest_dist < 5000
    very_near_industry = nearest_dist is not None and nearest_dist < 1000
    
    classification_result = None
    
    if very_near_industry and frp > 50:
        classification_result = ClassificationResult(
            classification=ClassificationEnum.GAS_FLARE,
            confidence_score=0.8,
            explanation="High FRP very near industrial facility.",
            evidence=["FRP > 50", "Distance < 1000m"],
            source_data={"method": "rule_based"}
        )
    elif near_industry and frp < 10:
        classification_result = ClassificationResult(
            classification=ClassificationEnum.PERSISTENT_INDUSTRIAL_SOURCE,
            confidence_score=0.7,
            explanation="Low FRP near industrial facility.",
            evidence=["FRP < 10", "Distance < 5000m"],
            source_data={"method": "rule_based"}
        )
    elif not near_industry and frp > 100:
        classification_result = ClassificationResult(
            classification=ClassificationEnum.WILDFIRE_FOREST_FIRE,
            confidence_score=0.75,
            explanation="Large FRP far from industry.",
            evidence=["FRP > 100", "No industry within 5km"],
            source_data={"method": "rule_based"}
        )
    elif not near_industry and not osm_context.near_water and frp < 25 and is_daytime:
        classification_result = ClassificationResult(
            classification=ClassificationEnum.AGRICULTURAL_BURN,
            confidence_score=0.7,
            explanation="Low/moderate FRP far from industry during daytime.",
            evidence=["FRP < 25", "Daytime", "No industry within 5km"],
            source_data={"method": "rule_based"}
        )
        
    if not classification_result or (near_industry and frp >= 10):
        gemini_result = await classify_with_gemini(hotspot, osm_context)
        if gemini_result:
            classification_result = gemini_result
            
    if not classification_result:
        classification_result = ClassificationResult(
            classification=ClassificationEnum.UNKNOWN_UNCERTAIN,
            confidence_score=0.1,
            explanation="Could not definitively classify the hotspot.",
            evidence=[],
            source_data={"method": "fallback"}
        )
        
    if not classification_result.source_data:
        classification_result.source_data = {}
    classification_result.source_data['osm_source'] = osm_context.osm_source
    if len(osm_context.nearby_facilities) > 0:
        fac = osm_context.nearby_facilities[0]
        classification_result.source_data['facility_name'] = fac.get('name')
        classification_result.source_data['facility_type'] = fac.get('type')
        classification_result.source_data['distance_m'] = fac.get('distance_m')
        
    risk_score, risk_level = calculate_risk_score(
        classification_result.classification, 
        frp, 
        nearest_dist, 
        hotspot.confidence
    )
    
    classification_result.risk_score = risk_score
    classification_result.risk_level = risk_level
        
    return ClassifiedHotspot(
        hotspot=hotspot,
        classification=classification_result,
        osm_context=osm_context
    )

async def classify_hotspots(hotspots: List[FIRMSHotspot]) -> List[ClassifiedHotspot]:
    classified_results = []
    
    for hotspot in hotspots:
        if hotspot.frp is None or hotspot.frp <= 0:
            continue
            
        try:
            osm_context = await enrich_hotspot(hotspot)
        except Exception as e:
            logger.warning(f"OSM enrichment failed for hotspot: {e}")
            osm_context = OSMContext(osm_source=OSMSourceEnum.FAILED)
            
        classified = await classify_hotspot_with_context(hotspot, osm_context)
        classified_results.append(classified)
        
    return classified_results

def persist_classification(classified_result: ClassifiedHotspot, db_client=None) -> str:
    from db.supabase_client import supabase_service
    sb = db_client or supabase_service
    
    hs = classified_result.hotspot
    stale_id = getattr(hs, '_stale_classification_id', None)
    db_id = getattr(hs, '_db_id', None)
    
    cls = classified_result.classification
    osm = classified_result.osm_context
    
    cls_data = {
        "classification": cls.classification.value if hasattr(cls.classification, "value") else str(cls.classification),
        "confidence_score": cls.confidence_score,
        "explanation": cls.explanation,
        "evidence": cls.evidence,
        "risk_score": cls.risk_score,
        "risk_level": cls.risk_level,
        "source_data": cls.source_data,
        "osm_context": {
            "nearby_facilities": osm.nearby_facilities,
            "nearest_facility_distance": osm.nearest_facility_distance,
            "nearest_facility_type": osm.nearest_facility_type,
            "land_use_context": osm.land_use_context,
            "water_context": osm.water_context,
            "near_water": osm.near_water,
            "osm_source": osm.osm_source.value if hasattr(osm.osm_source, "value") else str(osm.osm_source)
        }
    }
    
    if stale_id:
        sb.table("classifications").update(cls_data).eq("id", stale_id).execute()
        return "updated"
    else:
        if db_id:
            cls_data["hotspot_id"] = db_id
        sb.table("classifications").insert(cls_data).execute()
        return "inserted"

async def classify_and_store(country: str = 'IND', days: int = 1) -> List[ClassifiedHotspot]:
    from config import settings
    from db.supabase_client import supabase_service
    
    # 1. Fetch raw nationwide dataset
    hotspots = await fetch_realtime_hotspots(country=country, days=days)
    if not hotspots:
        return []
        
    # 2. Get existing classifications from the database
    try:
        # Fetch recent records to build a fast duplicate lookup table
        recent_records = supabase_service.table("hotspots").select("id, latitude, longitude, acq_date, acq_time, classifications(id)").order("created_at", desc=True).limit(2000).execute().data
        
        db_lookup = {}
        for r in (recent_records or []):
            key = f"{r.get('latitude')}_{r.get('longitude')}_{r.get('acq_date')}_{r.get('acq_time')}"
            db_lookup[key] = r
    except Exception as e:
        logger.warning(f"Failed to fetch recent DB hotspots: {e}")
        db_lookup = {}
        
    new_hotspots_to_insert = []
    unclassified_candidates = []
    already_classified_count = 0
    
    for h in hotspots:
        key = f"{h.latitude}_{h.longitude}_{str(h.acq_date)}_{h.acq_time}"
        
        if key in db_lookup:
            db_record = db_lookup[key]
            # Temporarily attach the db_id to the pydantic model instance
            setattr(h, '_db_id', db_record["id"])
            
            if db_record.get("classifications") and len(db_record["classifications"]) > 0:
                already_classified_count += 1
            else:
                unclassified_candidates.append(h)
        else:
            new_hotspots_to_insert.append(h)
            
    # Insert new hotspots into DB to get their IDs
    if new_hotspots_to_insert:
        try:
            insert_payload = []
            for h in new_hotspots_to_insert:
                payload = {
                    "latitude": h.latitude,
                    "longitude": h.longitude,
                    "acq_date": str(h.acq_date) if h.acq_date else None,
                    "acq_time": h.acq_time,
                    "satellite": h.satellite,
                    "instrument": h.instrument,
                    "confidence": h.confidence,
                    "frp": h.frp,
                    "daynight": h.daynight,
                }
                # These columns are available in the aligned schema but may not exist
                # in older live deployments, so add them only via a safe retry below.
                insert_payload.append(payload)
            
            # Persist each observation independently so one malformed row or schema
            # mismatch cannot discard the remainder of the live FIRMS batch.
            for idx, row in enumerate(insert_payload):
                try:
                    res = supabase_service.table("hotspots").insert(row).execute()
                    if res.data:
                        hs = new_hotspots_to_insert[idx]
                        setattr(hs, '_db_id', res.data[0]["id"])
                        unclassified_candidates.append(hs)
                except Exception as row_error:
                    logger.error(f"Skipping hotspot insert {idx}: {row_error}")
        except Exception as e:
            logger.error(f"Bulk insert of new hotspots failed: {e}")
            
    # 3. Priority Selection
    unclassified_candidates.sort(key=lambda x: x.frp, reverse=True)
    limit = getattr(settings, 'AI_CLASSIFICATION_LIMIT', 50)
    selected_for_ai = unclassified_candidates[:limit]
    remaining = len(unclassified_candidates) - len(selected_for_ai)
    
    logger.info(f"Candidates: {len(hotspots)} | Already classified: {already_classified_count} | Selected for AI: {len(selected_for_ai)} | Remaining: {remaining}")
    
    # 4. Classify ONLY the top priority ones
    classified_subset = await classify_hotspots(selected_for_ai)
    
    for c_hotspot in classified_subset:
        hs = c_hotspot.hotspot
        db_id = getattr(hs, '_db_id', None)
        if db_id:
            try:
                cls = c_hotspot.classification
                osm = c_hotspot.osm_context
                
                cls_data = {
                    "hotspot_id": db_id,
                    "classification": cls.classification.value,
                    "confidence_score": cls.confidence_score,
                    "explanation": cls.explanation,
                    "evidence": cls.evidence,
                    "risk_score": cls.risk_score,
                    "risk_level": cls.risk_level,
                    "source_data": cls.source_data,
                    "osm_context": {
                        "nearby_facilities": osm.nearby_facilities,
                        "nearest_facility_distance": osm.nearest_facility_distance,
                        "nearest_facility_type": osm.nearest_facility_type,
                        "land_use_context": osm.land_use_context,
                        "water_context": osm.water_context,
                        "near_water": osm.near_water,
                        "osm_source": osm.osm_source
                    }
                }
                supabase_service.table("classifications").insert(cls_data).execute()
                
            except Exception as e:
                logger.error(f"Failed to insert classification for hotspot {db_id}: {e}")
                
    return classified_subset
