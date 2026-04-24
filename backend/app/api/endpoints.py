import os
import io
import pandas as pd
import yfinance as yf
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.services.preprocessor import Preprocessor
from app.services.statistics_module import StatisticsEngine, compute_correlation_matrix
from app.models.schemas import RegisterRequest, TokenResponse, SettingsUpdate, CorrelationRequest, PCARequest
from app.database import get_db, User, UserSettings, AnalysisSession, AnalysisResult
from app.auth import hash_password, verify_password, create_access_token, get_current_user

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