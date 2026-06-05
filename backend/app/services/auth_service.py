from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.schemas import RegisterRequest, TokenResponse
from app.database import User, UserSettings
from app.auth import hash_password, verify_password, create_access_token
from app.services.validation import validate_password

async def register_user(data: RegisterRequest, db: AsyncSession) -> TokenResponse:
    validate_password(data.password)

    result = await db.execute(
        select(User).where(
            (User.email == data.email) | (User.username == data.username)
        )
    )
    existing_user = result.scalars().first() 

    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username is already taken")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password)
    )

    db.add(user)
    await db.flush()

    db.add(UserSettings(user_id=user.id))

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=token,
        username=user.username,
        email=user.email
    )

async def authenticate_user(username: str, password: str, db: AsyncSession) -> TokenResponse:
    result = await db.execute(
        select(User).where(
            (User.email == username) | (User.username == username)
        )
    )
    user = result.scalars().first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email/username or password")

    user.last_login = datetime.now(timezone.utc) 
    await db.commit()

    token = create_access_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=token,
        username=user.username,
        email=user.email
    )

async def update_user_password(
    current_password: str,
    new_password: str,
    current_user: User,
    db: AsyncSession
):
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is not correct")

    if current_password == new_password:
        raise HTTPException(
            status_code=400,
            detail="The new password must be different from the current one"
        )

    validate_password(new_password)

    current_user.hashed_password = hash_password(new_password)

    await db.commit()

    return {"message": "Password was successfully changed"}