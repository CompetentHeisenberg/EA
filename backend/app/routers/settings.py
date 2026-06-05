from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, User
from app.auth import get_current_user
from app.models.schemas import SettingsUpdate
from app.services.settings_service import get_user_settings, update_user_settings

router = APIRouter()

@router.get("/")
async def get_settings(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_user_settings(current_user, db)

@router.put("/")
async def update_settings(data: SettingsUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await update_user_settings(data, current_user, db)