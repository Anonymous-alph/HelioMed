from __future__ import annotations

import math
from typing import Literal

import httpx

from app.schemas.pharmacy import NearbyLocationResponse

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_TYPES: set[str] = {"pharmacy", "hospital", "clinic"}

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Overpass amenity tags for each allowed type
_AMENITY_MAP: dict[str, list[str]] = {
    "pharmacy": ["pharmacy"],
    "hospital": ["hospital"],
    "clinic": ["clinic", "doctors"],
}

_USER_AGENT = "HelioMed/1.0 (health-app; contact@heliomedapp.com)"

DEFAULT_RADIUS_M = 5000  # 5 km


# ---------------------------------------------------------------------------
# Haversine
# ---------------------------------------------------------------------------

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance in km between two lat/lon points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Nominatim geocoding (Indian zipcode → lat/lon)
# ---------------------------------------------------------------------------

async def geocode_indian_zipcode(
    zipcode: str,
    client: httpx.AsyncClient,
) -> tuple[float, float]:
    """Convert an Indian postal code to (lat, lon) via Nominatim.

    Raises ValueError if the zipcode can't be resolved.
    """
    resp = await client.get(
        NOMINATIM_URL,
        params={
            "postalcode": zipcode,
            "country": "India",
            "format": "json",
            "limit": 1,
        },
        headers={"User-Agent": _USER_AGENT},
        timeout=15.0,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise ValueError(f"Could not geocode Indian zipcode: {zipcode}")
    return float(data[0]["lat"]), float(data[0]["lon"])


# ---------------------------------------------------------------------------
# Overpass query builder
# ---------------------------------------------------------------------------

def _build_overpass_query(
    lat: float,
    lon: float,
    radius: int,
    location_types: list[str],
) -> str:
    """Build an Overpass QL query for the requested amenity types."""
    amenity_tags: list[str] = []
    for lt in location_types:
        amenity_tags.extend(_AMENITY_MAP.get(lt, []))

    # Build union of node queries
    parts: list[str] = []
    for tag in amenity_tags:
        parts.append(
            f'  node["amenity"="{tag}"](around:{radius},{lat},{lon});'
        )
        parts.append(
            f'  way["amenity"="{tag}"](around:{radius},{lat},{lon});'
        )

    union = "\n".join(parts)
    return f"[out:json][timeout:15];\n(\n{union}\n);\nout center body;"


# ---------------------------------------------------------------------------
# Overpass fetch + parse
# ---------------------------------------------------------------------------

async def _query_overpass(
    lat: float,
    lon: float,
    radius: int,
    location_types: list[str],
    client: httpx.AsyncClient,
) -> list[NearbyLocationResponse]:
    """Query Overpass API and return parsed results sorted by distance."""
    query = _build_overpass_query(lat, lon, radius, location_types)

    resp = await client.post(
        OVERPASS_URL,
        data={"data": query},
        headers={"User-Agent": _USER_AGENT},
        timeout=20.0,
    )
    resp.raise_for_status()
    elements = resp.json().get("elements", [])

    results: list[NearbyLocationResponse] = []
    seen_ids: set[int] = set()

    for el in elements:
        eid = el.get("id")
        if eid in seen_ids:
            continue
        seen_ids.add(eid)

        tags = el.get("tags", {})
        name = tags.get("name", tags.get("name:en", ""))
        if not name:
            continue  # skip unnamed POIs

        # For ways, use the 'center' key
        el_lat = el.get("lat") or (el.get("center", {}).get("lat"))
        el_lon = el.get("lon") or (el.get("center", {}).get("lon"))
        if el_lat is None or el_lon is None:
            continue

        amenity = tags.get("amenity", "")
        loc_type = _resolve_type(amenity)

        distance_km = _haversine_km(lat, lon, float(el_lat), float(el_lon))

        address_parts = [
            tags.get("addr:street", ""),
            tags.get("addr:city", ""),
            tags.get("addr:district", ""),
            tags.get("addr:state", ""),
            tags.get("addr:postcode", ""),
        ]
        address = ", ".join(p for p in address_parts if p) or tags.get("address", "Address not available")

        phone = tags.get("phone", tags.get("contact:phone", ""))
        website = tags.get("website", tags.get("contact:website", ""))
        opening_hours = tags.get("opening_hours", "Not available")

        results.append(
            NearbyLocationResponse(
                id=str(eid),
                name=name,
                type=loc_type,
                address=address,
                lat=float(el_lat),
                lon=float(el_lon),
                distance=round(distance_km, 2),
                phone=phone or None,
                website=website or None,
                hours=opening_hours,
            )
        )

    results.sort(key=lambda r: r.distance)
    return results


def _resolve_type(amenity: str) -> Literal["pharmacy", "hospital", "clinic"]:
    if amenity == "pharmacy":
        return "pharmacy"
    if amenity == "hospital":
        return "hospital"
    return "clinic"  # clinic, doctors → clinic


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def find_nearby_locations(
    *,
    zipcode: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius: int = DEFAULT_RADIUS_M,
    location_types: list[str] | None = None,
) -> dict:
    """Find nearby pharmacies, hospitals, and clinics.

    Accepts either an Indian zipcode (geocoded to lat/lon) or direct lat/lon.
    Returns a dict with 'center' (lat/lon used) and 'results' list.
    """
    types = [t for t in (location_types or list(ALLOWED_TYPES)) if t in ALLOWED_TYPES]
    if not types:
        types = list(ALLOWED_TYPES)

    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
        # Resolve coordinates
        if zipcode:
            lat, lon = await geocode_indian_zipcode(zipcode, client)
        elif lat is None or lon is None:
            raise ValueError("Either zipcode or lat/lon must be provided")

        results = await _query_overpass(lat, lon, radius, types, client)

    return {
        "center_lat": lat,
        "center_lon": lon,
        "radius_m": radius,
        "count": len(results),
        "results": results,
    }
