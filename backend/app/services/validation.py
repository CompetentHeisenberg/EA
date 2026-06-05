import re
from fastapi import HTTPException

check = re.compile(r'^(?=.*[A-Za-z])(?=.*\d).{8,}$')


def validate_password(password: str):
    if not check.match(password):
        raise HTTPException(
            status_code=400,
            detail="Password does not meet security requirements"
        )