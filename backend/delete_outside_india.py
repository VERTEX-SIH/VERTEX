
import httpx
_original_client_init = httpx.Client.__init__
httpx.Client.__init__ = lambda self, *args, **kwargs: _original_client_init(self, *args, **{**kwargs, 'verify': False})
import json
from pathlib import Path
from shapely.geometry import shape, Point
from db.supabase_client import supabase_service

s = shape(json.loads(Path('services/india_boundary.geojson').read_text('utf-8'))['geometry'])
res = supabase_service.table('hotspots').select('id, longitude, latitude').execute()
to_delete = [r['id'] for r in res.data if not s.contains(Point(r['longitude'], r['latitude']))]
print(f'Deleting {len(to_delete)} hotspots outside India...')
for i, chunk in enumerate([to_delete[i:i+50] for i in range(0, len(to_delete), 50)]):
    supabase_service.table('hotspots').delete().in_('id', chunk).execute()
    print(f'Deleted chunk {i+1}')
print('Done!')

