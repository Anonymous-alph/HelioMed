from __future__ import annotations

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_current_user
from app.schemas.pharmacy import NearbySearchResponse
from app.schemas.user import CurrentUser
from app.services.pharmacy_lookup import ALLOWED_TYPES, find_nearby_locations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pharmacies", tags=["pharmacies"])

_INDIAN_ZIP_RE = re.compile(r"^\d{6}$")


@router.get("/nearby", response_model=NearbySearchResponse)
async def nearby_locations(
    zipcode: str | None = Query(None, description="Indian 6-digit postal code"),
    lat: float | None = Query(None, description="Latitude (fallback if no zipcode)"),
    lon: float | None = Query(None, description="Longitude (fallback if no zipcode)"),
    radius: int = Query(5000, ge=500, le=50000, description="Search radius in meters"),
    types: str = Query(
        "pharmacy,hospital,clinic",
        description="Comma-separated location types: pharmacy, hospital, clinic",
    ),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Find nearby pharmacies, hospitals, and clinics.

    Provide either an Indian `zipcode` (6 digits) or `lat`/`lon` coordinates.
    """
    # Validate zipcode format
    if zipcode:
        if not _INDIAN_ZIP_RE.match(zipcode):
            raise HTTPException(
                status_code=400,
                detail="Invalid Indian zipcode. Must be exactly 6 digits.",
            )

    if not zipcode and (lat is None or lon is None):
        raise HTTPException(
            status_code=400,
            detail="Provide either a zipcode or both lat and lon.",
        )

    # Parse and validate types
    requested_types = [t.strip().lower() for t in types.split(",") if t.strip()]
    valid_types = [t for t in requested_types if t in ALLOWED_TYPES]
    if not valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid types. Allowed: {', '.join(sorted(ALLOWED_TYPES))}",
        )

    try:
        result = await find_nearby_locations(
            zipcode=zipcode,
            lat=lat,
            lon=lon,
            radius=radius,
            location_types=valid_types,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Nearby locations lookup failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch nearby locations: {type(e).__name__}: {e}",
        )

    return result
