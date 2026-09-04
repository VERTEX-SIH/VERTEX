from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db.supabase_client import supabase_anon
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

def verify_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Use get_user to verify token via Supabase Auth API
        response = supabase_anon.auth.get_user(token)
        user = response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token or user not found"
            )

        # Check for admin role in app_metadata or user_metadata
        app_metadata = user.app_metadata or {}
        user_metadata = user.user_metadata or {}
        
        if app_metadata.get("role") == "admin" or user_metadata.get("role") == "admin":
            return user
            
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin role required."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying admin user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
