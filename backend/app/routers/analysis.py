from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, User
from app.auth import get_current_user
from app.models.schemas import CorrelationRequest, PCARequest
from app.services.analysis_service import process_file_upload, execute_correlation, execute_pca, fetch_user_history, fetch_history_record

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await process_file_upload(file, current_user, db)

@router.post("/correlation")
async def get_correlation(request: CorrelationRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await execute_correlation(request, current_user, db)

@router.post("/pca")
async def get_pca(request: PCARequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await execute_pca(request, current_user, db)

@router.get("/history")
async def get_history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await fetch_user_history(current_user, db)

@router.get("/history/{session_id}")
async def get_history_result(session_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await fetch_history_record(session_id, current_user, db)