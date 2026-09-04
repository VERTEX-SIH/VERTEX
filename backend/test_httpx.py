import httpx
import os
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
print("Trying to hit:", url)

try:
    with httpx.Client(verify=False) as client:
        r = client.get(url + "/rest/v1/")
        print("Status:", r.status_code)
except Exception as e:
    print("Exception:", e)
