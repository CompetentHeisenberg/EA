from fastapi import APIRouter
from app.services.market_service import fetch_financial_summary, fetch_trending_data, fetch_markets_data

router = APIRouter()

@router.get("/financial")
async def get_financial_data():
    return await fetch_financial_summary()

@router.get("/trending")
async def get_trending():
    return await fetch_trending_data()

@router.get("/markets")
async def get_markets():
    return await fetch_markets_data()