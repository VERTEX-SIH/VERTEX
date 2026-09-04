import urllib.request
import json

def run_test():
    url = "http://localhost:8000/api/v1/hotspots/classified?country=IND&days=1&limit=5"
    r = urllib.request.urlopen(url, timeout=120)
    data = json.loads(r.read())

    print(f"Type: {data.get('type')}")
    print(f"Features count: {len(data.get('features', []))}")
    print()

    for i, feat in enumerate(data.get('features', [])[:5]):
        props = feat['properties']
        cls = props.get('classification', {})
        ctx = props.get('osm_context', {})
        print(f"--- Hotspot {i+1} ---")
        print(f"  Classification: {cls.get('classification')}")
        print(f"  Confidence: {cls.get('confidence_score')}")
        print(f"  Risk: {cls.get('risk_level')} (score: {cls.get('risk_score')})")
        print(f"  FRP: {props.get('frp')} MW")
        print(f"  Nearest facility: {ctx.get('nearest_facility_type')} @ {ctx.get('nearest_facility_distance')}m")
        print(f"  OSM source: {ctx.get('osm_source')}")
        print(f"  Explanation: {cls.get('explanation', '')[:120]}...")
        print()

if __name__ == '__main__':
    run_test()
