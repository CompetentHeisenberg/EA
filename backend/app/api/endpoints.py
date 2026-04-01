from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.preprocessor import Preprocessor
from app.services.statistics_module import StatisticsEngine, compute_correlation_matrix
from app.models.schemas import AnalysisRequest, AnalysisResponse, CorrelationRequest
from app.database import get_db, User, UserSettings, AnalysisSession, AnalysisResult
from app.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)
from pydantic import BaseModel, EmailStr
import pandas as pd
import io
import yfinance as yf
router = APIRouter()
preprocessor = Preprocessor()
stats_engine = StatisticsEngine()

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


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    email: str


@router.post("/auth/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email або username вже зайнятий")

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
        raise HTTPException(status_code=401, detail="Невірний email або пароль")

    from datetime import datetime
    user.last_login = datetime.utcnow()
    await db.commit()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, username=user.username, email=user.email)


@router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}


class SettingsUpdate(BaseModel):
    default_clusters: int = 3
    preferred_pca_axes: str = "PC1,PC2"
    theme: str = "light"


@router.get("/settings")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Налаштування не знайдені")
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
    return {"message": "Налаштування збережено"}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Формат файлу має бути CSV або Excel")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith('.csv') \
            else pd.read_excel(io.BytesIO(contents))

        df_clean = preprocessor.clean_and_validate(df)

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

        return {
            "session_id": session.id,
            "columns": df_clean.columns.tolist(),
            "data": df_clean.head(50).to_dict(orient="records"),
            "message": f"Завантажено {len(df_clean)} рядків"
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
        result = compute_correlation_matrix(request.data)

        session = AnalysisSession(
            user_id=current_user.id,
            file_name="—",
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


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_data(
    request: AnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        df = pd.DataFrame(request.data)
        df_scaled = preprocessor.scale_data(df)
        clusters, pca_df, variance = stats_engine.run_full_analysis(df_scaled, request.n_clusters)

        result = {
            "clusters": clusters.tolist(),
            "pca_data": pca_df.to_dict(orient="records"),
            "variance": variance.tolist()
        }

        session = AnalysisSession(
            user_id=current_user.id,
            file_name="—",
            file_rows=len(df),
            file_cols=len(df.columns),
            analysis_type="pca",
            columns_used=df.columns.tolist(),
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