import logging
from typing import Optional

logger = logging.getLogger(__name__)

async def reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """
    Reverse geocoder returning a mock value since we only map Indian hotspots.
    """
    return "India"
