import os
import sys
import traceback

# Add current dir to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.supabase_client import supabase_service
from config import settings

def run_test():
    print(f"Testing connection to SUPABASE_URL: {settings.SUPABASE_URL}")
    print("-" * 50)
    
    try:
        # Try a simple select to test connectivity
        response = supabase_service.table("hotspots").select("id").limit(1).execute()
        print("✅ SUCCESS! Connected to Supabase.")
        print(f"Response data: {response.data}")
    except Exception as e:
        print("❌ FAILED TO CONNECT TO SUPABASE.")
        print("-" * 50)
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        print("\nFull Traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
