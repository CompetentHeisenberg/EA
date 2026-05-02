import os
import io
import pandas as pd
import yfinance as yf
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import re
import time
import feedparser
from app.services.preprocessor import Preprocessor
from app.services.statistics_module import StatisticsEngine, compute_correlation_matrix
from app.models.schemas import RegisterRequest, TokenResponse, SettingsUpdate, CorrelationRequest, PCARequest
from app.database import get_db, User, UserSettings, AnalysisSession, AnalysisResult
from app.auth import hash_password, verify_password, create_access_token, get_current_user
import trafilatura
from pydantic import BaseModel

router = APIRouter()
preprocessor = Preprocessor()
stats_engine = StatisticsEngine()
nltk.download('vader_lexicon', quiet=True)
sia = SentimentIntensityAnalyzer()

TICKERS = {
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "DOW JONES": "^DJI",
    "EUR/USD": "EURUSD=X",
    "BTC/USD": "BTC-USD",
    "ETH/USD": "ETH-USD",
    "Gold": "GC=F",
    "Oil (WTI)": "CL=F",
    "Apple": "AAPL",
    "Tesla": "TSLA",
    "Microsoft": "MSFT",
    "Amazon": "AMZN",
}

TEMP_DATA_DIR = "./temp_data"
os.makedirs(TEMP_DATA_DIR, exist_ok=True)


@router.get("/financial")
async def get_financial_data():
    try:
        result = []
        for label, symbol in TICKERS.items():
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")
            if len(hist) >= 2:
                prev_close = hist["Close"].iloc[-2]
                last_close = hist["Close"].iloc[-1]
                change = ((last_close - prev_close) / prev_close) * 100
                sign = "+" if change >= 0 else ""
                result.append({
                    "label": label,
                    "value": f"{last_close:,.2f} ({sign}{change:.2f}%)"
                })
            elif len(hist) == 1:
                last_close = hist["Close"].iloc[-1]
                result.append({
                    "label": label,
                    "value": f"{last_close:,.2f}"
                })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username is already taken")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password)
    )
    db.add(user)
    await db.flush()

    settings = UserSettings(user_id=user.id)
    db.add(settings)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, username=user.username, email=user.email)

@router.post("/auth/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user.last_login = datetime.utcnow()
    await db.commit()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, username=user.username, email=user.email)

@router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}

@router.get("/settings")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings

@router.put("/settings")
async def update_settings(
    data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalar_one_or_none()
    if settings:
        settings.default_clusters = data.default_clusters
        settings.preferred_pca_axes = data.preferred_pca_axes
        settings.theme = data.theme
        await db.commit()
    return {"message": "Settings saved"}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File format must be CSV or Excel")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith('.csv') \
            else pd.read_excel(io.BytesIO(contents))

        df_clean = preprocessor.clean_and_validate(df)

        text_cols = df.select_dtypes(exclude=['number', 'bool']).columns
        for col in text_cols:
            if col not in df_clean.columns:
                df_clean[col] = df[col].values

        session = AnalysisSession(
            user_id=current_user.id,
            file_name=file.filename,
            file_rows=len(df_clean),
            file_cols=len(df_clean.columns),
            analysis_type="upload",
            columns_used=df_clean.columns.tolist(),
            parameters={}
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        file_path = os.path.join(TEMP_DATA_DIR, f"{session.id}.parquet")
        df_clean.to_parquet(file_path, index=False)
        df_preview = df_clean.head(50).where(pd.notnull(df_clean.head(50)), None)
        
        numeric_cols = df_clean.select_dtypes(include=['number']).columns.tolist()

        return {
            "file_id": session.id,
            "columns": df_clean.columns.tolist(),
            "numeric_columns": numeric_cols,
            "total_rows": len(df_clean),
            "preview_data": df_preview.to_dict(orient="records"),
            "message": f"Loaded {len(df_clean)} rows"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis/correlation")
async def get_correlation(
    request: CorrelationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        file_path = os.path.join(TEMP_DATA_DIR, f"{request.file_id}.parquet")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Data file not found")

        df = pd.read_parquet(file_path)

        missing_cols = [col for col in request.columns if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Columns not found: {missing_cols}")

        df_selected = df[request.columns].dropna()
        
        data_dict = {col: df_selected[col].tolist() for col in request.columns}
        result = compute_correlation_matrix(data_dict)

        session = AnalysisSession(
            user_id=current_user.id,
            file_name=request.file_name,
            file_rows=result["observations"],
            file_cols=len(result["tickers"]),
            analysis_type="correlation",
            columns_used=result["tickers"],
            parameters={}
        )
        db.add(session)
        await db.flush()

        db.add(AnalysisResult(session_id=session.id, result_data=result))
        await db.commit()

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis/pca")
async def get_pca(
    request: PCARequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        file_path = os.path.join(TEMP_DATA_DIR, f"{request.file_id}.parquet")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Data file not found")

        df = pd.read_parquet(file_path)

        missing_cols = [col for col in request.columns if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Columns not found: {missing_cols}")

        cols_to_extract = request.columns.copy()
        if request.label_column and request.label_column in df.columns:
            cols_to_extract.append(request.label_column)

        df_selected = df[cols_to_extract].dropna()

        df_for_math = df_selected[request.columns]
        df_scaled = preprocessor.scale_data(df_for_math)
        
        clusters, pca_df, variance = stats_engine.run_full_analysis(df_scaled, request.n_clusters)

        result = {
            "clusters": clusters.tolist(),
            "pca_data": pca_df.to_dict(orient="records"),
            "variance": variance.tolist(),
            "original_data": df_selected.to_dict(orient="records")
        }

        session = AnalysisSession(
            user_id=current_user.id,
            file_name=request.file_name,
            file_rows=len(df_selected),
            file_cols=len(request.columns),
            analysis_type="pca",
            columns_used=request.columns,
            parameters={"n_clusters": request.n_clusters}
        )
        db.add(session)
        await db.flush()

        db.add(AnalysisResult(session_id=session.id, result_data=result))
        await db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AnalysisSession)
        .where(AnalysisSession.user_id == current_user.id)
        .order_by(AnalysisSession.created_at.desc())
        .limit(20)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "file_name": s.file_name,
            "analysis_type": s.analysis_type,
            "columns_used": s.columns_used,
            "parameters": s.parameters,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]

@router.get("/history/{session_id}")
async def get_history_result(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(AnalysisSession, AnalysisResult)
        .join(AnalysisResult, AnalysisSession.id == AnalysisResult.session_id)
        .where(
            AnalysisSession.id == session_id,
            AnalysisSession.user_id == current_user.id
        )
    )
    row = await db.execute(query)
    data = row.first()

    if not data:
        raise HTTPException(status_code=404, detail="Result not found")

    session, analysis_result = data

    return {
        "session": {
            "id": session.id,
            "file_name": session.file_name,
            "analysis_type": session.analysis_type,
            "created_at": session.created_at.isoformat() if session.created_at else None,
        },
        "result": analysis_result.result_data
    }

RSS_FEEDS = [
    "https://finance.yahoo.com/news/rssindex",
    "https://www.coindesk.com/arc/outboundfeeds/rss/"
]

CATEGORIES = {
    "Crypto": ["bitcoin", "btc", "ethereum", "eth", "crypto", "blockchain", "binance"],
    "Fed Policy": ["fed", "powell", "rates", "inflation", "interest", "fomc"],
    "Earnings": ["earnings", "revenue", "profit", "q1", "q2", "q3", "q4"],
    "Commodities": ["oil", "gold", "silver", "crude", "energy", "copper"],
    "Stocks": ["stock", "shares", "wall street", "nasdaq", "s&p", "dow"],
    "Economy": ["economy", "jobs", "gdp", "recession", "unemployment"]
}

def categorize_news(text: str) -> str:
    text_lower = text.lower()
    for category, keywords in CATEGORIES.items():
        if any(word in text_lower for word in keywords):
            return category
    return "Markets"

def get_sentiment(text: str) -> str:
    score = sia.polarity_scores(text)['compound']
    if score > 0.15:
        return "positive"
    elif score < -0.15:
        return "negative"
    return "neutral"

def clean_html(raw_html: str) -> str:
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html).strip()

def format_time_ago(parsed_time) -> str:
    if not parsed_time:
        return "Recently"
    diff = time.time() - time.mktime(parsed_time)
    if diff < 3600:
        return f"{int(diff // 60)} min ago"
    elif diff < 86400:
        return f"{int(diff // 3600)} hr ago"
    return f"{int(diff // 86400)} d ago"

@router.get("/news/feed")
async def get_news_feed():
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

class ArticleRequest(BaseModel):
    url: str

@router.post("/news/extract")
async def extract_full_text(request: ArticleRequest):
    try:
        downloaded = trafilatura.fetch_url(request.url)
        if not downloaded:
            raise HTTPException(status_code=400, detail="Failed to load site")
        
        text = trafilatura.extract(downloaded)
        
        if not text:
            return {"text": "Unfortunately, the site has blocked automatic reading. Please follow the link below."}
            
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/trending")
async def get_trending_data():
    try:
        stock_symbols = ["NVDA", "TSLA", "AAPL", "MSFT", "META", "AMZN", "GOOGL", "AMD", "INTC"]
        crypto_symbols = ["BTC-USD", "ETH-USD"]
        all_symbols = stock_symbols + crypto_symbols

        data = yf.download(" ".join(all_symbols), period="1d", interval="15m", progress=False)

        results = []
        for sym in all_symbols:
            close_series = data['Close'][sym].dropna()

            if len(close_series) >= 2:
                first_price = float(close_series.iloc[0])
                last_price = float(close_series.iloc[-1])
                change_pct = ((last_price - first_price) / first_price) * 100
                
                prices = close_series.tail(20).tolist()
                
                name = sym.replace("-USD", "")
                
                results.append({
                    "symbol": name,
                    "name": name,
                    "change": f"{'+' if change_pct >= 0 else ''}{change_pct:.2f}%",
                    "change_raw": change_pct,
                    "price": f"{last_price:,.2f}",
                    "spark": prices
                })

        crypto_data = [r for r in results if r["symbol"] in ["BTC", "ETH"]]
        stock_data = [r for r in results if r["symbol"] not in ["BTC", "ETH"]]

        stock_data.sort(key=lambda x: x["change_raw"], reverse=True)

        return {
            "gainers": stock_data[:4],
            "losers": stock_data[-4:],
            "crypto": crypto_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

STOCK_SYMBOLS = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA", 
    "JPM", "BAC", "XOM", "JNJ", "WMT", "BTC-USD", "ETH-USD"
]

INDEX_SYMBOLS = {
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "DOW JONES": "^DJI",
    "VIX": "^VIX",
    "10Y Treasury": "^TNX",
    "DXY": "DX-Y.NYB"
}

def format_number(num):
    if pd.isna(num) or num is None:
        return "N/A"
    if num >= 1e12:
        return f"{num / 1e12:.2f}T"
    if num >= 1e9:
        return f"{num / 1e9:.2f}B"
    if num >= 1e6:
        return f"{num / 1e6:.2f}M"
    return str(num)

def get_sector(symbol):
    if "-USD" in symbol:
        return "Crypto"
    if symbol in ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA"]:
        return "Tech"
    if symbol in ["JPM", "BAC"]:
        return "Finance"
    if symbol in ["XOM"]:
        return "Energy"
    if symbol in ["JNJ"]:
        return "Healthcare"
    if symbol in ["WMT"]:
        return "Consumer"
    return "Other"

@router.get("/markets")
async def get_markets():
    try:
        stock_tickers = yf.Tickers(" ".join(STOCK_SYMBOLS))
        stocks_data = []
        
        for symbol in STOCK_SYMBOLS:
            info = stock_tickers.tickers[symbol].info
            clean_symbol = symbol.replace("-USD", "")
            
            price = info.get("regularMarketPrice") or info.get("currentPrice", 0)
            prev_close = info.get("regularMarketPreviousClose", price)
            change_percent = ((price - prev_close) / prev_close * 100) if prev_close and price else 0
            
            stocks_data.append({
                "symbol": clean_symbol,
                "name": info.get("shortName") or info.get("longName") or clean_symbol,
                "sector": get_sector(symbol),
                "price": round(price, 2) if price else 0,
                "change": round(change_percent, 2),
                "volume": format_number(info.get("regularMarketVolume") or info.get("volume")),
                "mktCap": format_number(info.get("marketCap")),
                "pe": round(info.get("trailingPE"), 1) if info.get("trailingPE") else None,
                "beta": round(info.get("beta"), 2) if info.get("beta") else None,
                "week52High": round(info.get("fiftyTwoWeekHigh", 0), 2),
                "week52Low": round(info.get("fiftyTwoWeekLow", 0), 2),
                "dividendYield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else 0,
            })

        index_tickers = yf.Tickers(" ".join(INDEX_SYMBOLS.values()))
        indices_data = []
        
        for name, symbol in INDEX_SYMBOLS.items():
            info = index_tickers.tickers[symbol].info
            price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose", 0)
            prev_close = info.get("regularMarketPreviousClose", price)
            change_percent = ((price - prev_close) / prev_close * 100) if prev_close and price else 0
            
            indices_data.append({
                "name": name,
                "value": round(price, 2) if price else 0,
                "change": round(change_percent, 2)
            })

        return {"stocks": stocks_data, "indices": indices_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))