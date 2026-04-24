from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    email: str

class SettingsUpdate(BaseModel):
    default_clusters: int = 3
    preferred_pca_axes: str = "PC1,PC2"
    theme: str = "light"

class CorrelationRequest(BaseModel):
    file_id: int
    columns: List[str]
    file_name: str = "Correlation Analysis"

class PCARequest(BaseModel):
    file_id: int
    columns: List[str]
    label_column: Optional[str] = None
    n_clusters: int = 3
    file_name: str = "PCA Analysis"