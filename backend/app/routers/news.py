from fastapi import APIRouter
from pydantic import BaseModel
from app.services.news_service import fetch_news_feed, extract_article_text

router = APIRouter()

class ArticleRequest(BaseModel):
    url: str

@router.get("/feed")
async def get_news_feed():
    return await fetch_news_feed()

@router.post("/extract")
async def extract_full_text(request: ArticleRequest):
    return await extract_article_text(request.url)