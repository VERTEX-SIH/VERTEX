import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

print(f"URL: {url}")
if not url or not key:
    print("Missing env")
    exit(1)

sb = create_client(url, key)
try:
    res = sb.table('hotspots').select('*').limit(1).execute()
    print("Hotspots table exists:", res.data)
except Exception as e:
    print("Error on hotspots:", e)

try:
    res2 = sb.table('classifications').select('*').limit(1).execute()
    print("Classifications table exists:", res2.data)
except Exception as e:
    print("Error on classifications:", e)
