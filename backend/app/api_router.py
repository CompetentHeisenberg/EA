from fastapi import APIRouter
from app.routers import auth, settings, markets, news, analysis

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(settings.router, prefix="/settings", tags=["settings"])
router.include_router(markets.router, tags=["markets"])
router.include_router(news.router, prefix="/news", tags=["news"])
router.include_router(analysis.router, tags=["analysis"])