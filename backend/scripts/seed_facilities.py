import sys
import os
import json
import asyncio

# Ensure backend directory is in path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from db.supabase_client import supabase_service
import httpx

def run_seed():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'india_industrial_facilities.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        facilities = json.load(f)
    
    success_count = 0
    invalid_count = 0
    
    for fac in facilities:
        if 'name' not in fac or 'latitude' not in fac or 'longitude' not in fac or 'type' not in fac:
            print(f'Invalid facility (missing required fields): {fac}')
            invalid_count += 1
            continue
            
        data = {
            'name': fac['name'],
            'type': fac['type'],
            'latitude': fac['latitude'],
            'longitude': fac['longitude'],
            'radius_m': fac.get('radius_m', 5000),
            'source': 'JSON_IMPORT'
        }
        
        # Check if exists to avoid duplicates
        existing = supabase_service.table('industrial_facilities').select('id').eq('name', data['name']).eq('latitude', data['latitude']).execute()
        
        if existing.data and len(existing.data) > 0:
            print(f"Skipping existing: {data['name']}")
            continue
            
        try:
            supabase_service.table('industrial_facilities').insert(data).execute()
            success_count += 1
            print(f"Inserted: {data['name']}")
        except Exception as e:
            print(f"Failed to insert {data['name']}: {e}")
            invalid_count += 1
            
    print('\n--- IMPORT SUMMARY ---')
    print(f'Total in JSON: {len(facilities)}')
    print(f'Successfully Inserted: {success_count}')
    print(f'Invalid/Failed: {invalid_count}')

if __name__ == '__main__':
    # Patch httpx to avoid SSL errors with supabase
    _original_client_init = httpx.Client.__init__
    httpx.Client.__init__ = lambda self, *args, **kwargs: _original_client_init(self, *args, **{**kwargs, 'verify': False})
    
    run_seed()

