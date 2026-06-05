from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db, User
from app.auth import get_current_user
from app.models.schemas import RegisterRequest, TokenResponse
from app.services.auth_service import register_user, authenticate_user, update_user_password

router = APIRouter()

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await register_user(data, db)

@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    return await authenticate_user(form.username, form.password, db)

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}

@router.post("/change-password")
async def change_password(data: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await update_user_password(data.current_password, data.new_password, current_user, db)