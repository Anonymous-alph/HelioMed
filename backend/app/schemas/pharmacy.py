from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class NearbyLocationResponse(BaseModel):
    id: str
    name: str
    type: Literal["pharmacy", "hospital", "clinic"]
    address: str
    lat: float
    lon: float
    distance: float  # km from search center
    phone: str | None = None
    website: str | None = None
    hours: str = "Not available"


class NearbySearchResponse(BaseModel):
    center_lat: float
    center_lon: float
    radius_m: int
    count: int
    results: list[NearbyLocationResponse]
