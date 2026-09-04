import asyncio
from db.supabase_client import supabase_service
from services.osm_service import enrich_hotspot
from models.hotspot import FIRMSHotspot

async def sweep():
    stuck = supabase_service.table('classifications').select('hotspot_id, osm_context, hotspots(*)').execute().data
    for r in stuck:
        if r.get('osm_context', {}).get('osm_source') != 'PENDING': continue
        if not r.get('hotspots'): continue
        hs = FIRMSHotspot(**r['hotspots'])
        ctx = await enrich_hotspot(hs)
        osm_data = {'nearby_facilities': ctx.nearby_facilities, 'nearest_facility_distance': ctx.nearest_facility_distance, 'nearest_facility_type': ctx.nearest_facility_type, 'land_use_context': ctx.land_use_context, 'osm_source': ctx.osm_source}
        supabase_service.table('classifications').update({'osm_context': osm_data}).eq('hotspot_id', r['hotspot_id']).execute()
        print(f"Fixed {r['hotspot_id']} -> {ctx.osm_source}")

if __name__ == '__main__':
    asyncio.run(sweep())
