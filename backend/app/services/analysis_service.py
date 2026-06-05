import os
import io
import pandas as pd
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.constants.system import TEMP_DATA_DIR
from app.database import User, AnalysisSession, AnalysisResult
from app.services.preprocessor import Preprocessor
from app.services.statistics_module import StatisticsEngine, compute_correlation_matrix
from app.models.schemas import CorrelationRequest, PCARequest

preprocessor = Preprocessor()
stats_engine = StatisticsEngine()

async def process_file_upload(file: UploadFile, current_user: User, db: AsyncSession):
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

async def execute_correlation(request: CorrelationRequest, current_user: User, db: AsyncSession):
    try:
        file_path = os.path.join(TEMP_DATA_DIR, f"{request.file_id}.parquet")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Data file not found")

        df = pd.read_parquet(file_path)

        missing_cols = [col for col in request.columns if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Columns not found: {missing_cols}")

        df_selected = df[request.columns].dropna()
        
        if request.handle_outliers:
            df_selected = preprocessor.clean_and_validate(df_selected, handle_outliers=True)

        data_dict = {col: df_selected[col].tolist() for col in request.columns}
        result = compute_correlation_matrix(data_dict, method=request.method)

        session = AnalysisSession(
            user_id=current_user.id,
            file_name=request.file_name,
            file_rows=result["observations"],
            file_cols=len(result["tickers"]),
            analysis_type="correlation",
            columns_used=result["tickers"],
            parameters={"method": request.method, "handle_outliers": request.handle_outliers}
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

async def execute_pca(request: PCARequest, current_user: User, db: AsyncSession):
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
        
        clusters, pca_df, variance, loadings, cluster_metrics = stats_engine.run_full_analysis(df_scaled, request.n_clusters)

        result = {
            "clusters": clusters,
            "pca_data": pca_df.to_dict(orient="records"),
            "variance": variance,
            "original_data": df_selected.to_dict(orient="records"),
            "loadings": loadings,
            "cluster_metrics": cluster_metrics,
            "label_column": request.label_column
        }

        session = AnalysisSession(
            user_id=current_user.id,
            file_name=request.file_name,
            file_rows=len(df_selected),
            file_cols=len(request.columns),
            analysis_type="pca",
            columns_used=request.columns,
            parameters={"n_clusters": request.n_clusters, "label_column": request.label_column}
        )
        db.add(session)
        await db.flush()

        db.add(AnalysisResult(session_id=session.id, result_data=result))
        await db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def fetch_user_history(current_user: User, db: AsyncSession):
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

async def fetch_history_record(session_id: int, current_user: User, db: AsyncSession):
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
            "columns_used": session.columns_used,
            "parameters": session.parameters,
            "analysis_type": session.analysis_type,
            "created_at": session.created_at.isoformat() if session.created_at else None,
        },
        "result": analysis_result.result_data
    }