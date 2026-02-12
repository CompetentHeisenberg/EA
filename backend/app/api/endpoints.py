from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.preprocessor import Preprocessor
from app.services.statistics_module import StatisticsEngine
from app.models.schemas import AnalysisRequest, AnalysisResponse
import pandas as pd
import io

router = APIRouter()
preprocessor = Preprocessor()
stats_engine = StatisticsEngine()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Формат файлу має бути CSV або Excel")
    
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        df_clean = preprocessor.clean_and_validate(df)
        
        return {
            "columns": df_clean.columns.tolist(),
            "data": df_clean.head(50).to_dict(orient="records"),
            "message": "Файл успішно оброблено!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_data(request: AnalysisRequest):
    try:
        df = pd.DataFrame(request.data)
        
        df_scaled = preprocessor.scale_data(df)
        
        clusters, pca_df, variance = stats_engine.run_full_analysis(df_scaled, request.n_clusters)
        
        return {
            "clusters": clusters.tolist(),
            "pca_data": pca_df.to_dict(orient="records"),
            "variance": variance.tolist()
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))