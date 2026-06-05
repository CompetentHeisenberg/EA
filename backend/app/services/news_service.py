import feedparser
import trafilatura
from fastapi import HTTPException
from app.constants.news import RSS_FEEDS
from app.utils.formatters import clean_html, format_time_ago
from app.utils.news_helpers import categorize_news, get_sentiment

async def fetch_news_feed():
    all_news = []
    
    for feed_url in RSS_FEEDS:
        parsed_feed = feedparser.parse(feed_url)
        
        for i, entry in enumerate(parsed_feed.entries[:5]):
            title = entry.get('title', '')
            summary = clean_html(entry.get('summary', ''))
            full_text = f"{title} {summary}"
            
            news_item = {
                "id": f"{parsed_feed.feed.get('title', 'src')}_{i}",
                "headline": title[:90] + "..." if len(title) > 90 else title,
                "summary": summary[:200] + "..." if len(summary) > 200 else summary,
                "category": categorize_news(full_text),
                "source": parsed_feed.feed.get('title', 'News Source'),
                "time": format_time_ago(entry.get('published_parsed')),
                "sentiment": get_sentiment(full_text),
                "imageQuery": categorize_news(full_text),
                "link": entry.get('link', '')
            }
            all_news.append(news_item)
            
    return all_news[:6]

async def extract_article_text(url: str):
    try:
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            raise HTTPException(status_code=400, detail="Failed to load site")
        
        text = trafilatura.extract(downloaded)
        
        if not text:
            return {"text": "Unfortunately, the site has blocked automatic reading. Please follow the link below."}
            
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))