import httpx
import time

def run_test():
    print('Triggering classification pipeline...')
    start = time.time()
    r = httpx.get('http://localhost:8000/api/v1/hotspots/classified?country=IND&days=1', timeout=120.0)
    print(f'Status: {r.status_code} in {time.time()-start:.1f}s')

    data = r.json()
    print('Type:', data.get('type'))
    features = data.get('features', [])
    print('Total Classified Hotspots:', len(features))

    for i, f in enumerate(features[:3]):
        props = f.get('properties', {})
        cls_data = props.get('classification', {})
        hotspot = props.get('hotspot', {})
        osm = props.get('osm_context', {})
        
        print(f'\n--- Hotspot {i+1} ---')
        print(f'Coordinates: {f.get("geometry", {}).get("coordinates")}')
        print(f'FRP: {hotspot.get("frp")} MW | Confidence: {hotspot.get("confidence")}')
        print(f'Nearest Industrial Facility: {osm.get("nearest_facility_type")} at {osm.get("nearest_facility_distance")}m')
        print(f'AI Classification: {cls_data.get("classification")} ({cls_data.get("confidence_score")} conf)')
        print(f'Explanation: {cls_data.get("explanation")}')

if __name__ == '__main__':
    run_test()
