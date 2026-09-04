from supabase import create_client, Client
from config import settings

# Initialize singleton clients
def get_supabase_client(use_service_key: bool = False) -> Client:
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_SERVICE_KEY if use_service_key else settings.SUPABASE_ANON_KEY
    return create_client(url, key)

supabase_anon: Client = get_supabase_client(use_service_key=False)
supabase_service: Client = get_supabase_client(use_service_key=True)

import logging

logger = logging.getLogger(__name__)

async def seed_admin_user():
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        logger.info("Admin seeding skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set.")
        return

    try:
        # Try to sign in to check if the user exists
        try:
            supabase_anon.auth.sign_in_with_password({
                "email": settings.ADMIN_EMAIL,
                "password": settings.ADMIN_PASSWORD
            })
            logger.info("Admin user already exists.")
            return
        except Exception:
            pass  # Expected if user doesn't exist
            
        # Create user via admin API
        supabase_service.auth.admin.create_user({
            "email": settings.ADMIN_EMAIL,
            "password": settings.ADMIN_PASSWORD,
            "email_confirm": True,
            "user_metadata": {"role": "admin"}
        })
        logger.info("Admin user seeded successfully.")
    except Exception as e:
        logger.warning(f"Skipping admin seed - database unreachable: {e}")

