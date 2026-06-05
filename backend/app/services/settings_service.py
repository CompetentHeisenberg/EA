from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.models.schemas import SettingsUpdate
from app.database import User, UserSettings

async def get_user_settings(current_user: User, db: AsyncSession):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings

async def update_user_settings(data: SettingsUpdate, current_user: User, db: AsyncSession):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalar_one_or_none()
    if settings:
        settings.default_clusters = data.default_clusters
        settings.preferred_pca_axes = data.preferred_pca_axes
        settings.theme = data.theme
        settings.correlation_method = data.correlation_method
        settings.outlier_treatment = data.outlier_treatment
        await db.commit()
    return {"message": "Settings saved"}