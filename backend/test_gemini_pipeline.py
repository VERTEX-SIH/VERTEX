import asyncio
import json
from models.hotspot import FIRMSHotspot
from models.classification import OSMContext
from services.gemini_service import classify_with_gemini

async def run_test():
    hotspot = FIRMSHotspot(
        latitude=29.4,
        longitude=76.9,
        bright_ti4=350.0,
        frp=150.5,
        confidence="h",
        daynight="N",
        satellite="VIIRS",
        acq_date="2026-08-30",
        acq_time="1200",
        instrument="VIIRS"
    )
    
    context = OSMContext(
        nearby_facilities=[
            {"name": "IOCL Panipat Refinery", "type": "refinery", "distance_meters": 450.0}
        ],
        nearest_facility_distance=450.0,
        nearest_facility_type="refinery",
        facility_count_in_radius=3,
        land_use_context=["industrial", "commercial"]
    )
    
    print("Sending mock industrial hotspot to Gemini for classification...")
    try:
        result = await classify_with_gemini(hotspot, context)
        print("--- GEMINI CLASSIFICATION SUCCESS ---")
        print(f"Classification: {result.classification.value}")
        print(f"Confidence: {result.confidence_score}")
        print(f"Explanation: {result.explanation}")
        print(f"Evidence: {result.evidence}")
    except Exception as e:
        print(f"--- GEMINI CALL FAILED ---")
        print(e)

if __name__ == "__main__":
    asyncio.run(run_test())
