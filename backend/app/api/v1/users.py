from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user_profile import UserProfile
from app.schemas.user import CurrentUser, UserProfileCreate, UserProfileResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(
            user_id=current_user.id,
            full_name=current_user.name or "",
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.post("/profile", response_model=UserProfileResponse)
async def upsert_profile(
    body: UserProfileCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(
            user_id=current_user.id,
            role=body.role,
            full_name=body.full_name,
        )
        db.add(profile)
    else:
        profile.role = body.role
        profile.full_name = body.full_name
    await db.commit()
    await db.refresh(profile)
    return profile
