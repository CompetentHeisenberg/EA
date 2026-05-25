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
    default_clusters: int
    preferred_pca_axes: str
    theme: str
    correlation_method: Optional[str] = "pearson"
    outlier_treatment: Optional[str] = "none"

class CorrelationRequest(BaseModel):
    file_id: int
    columns: List[str]
    file_name: str
    method: Optional[str] = "pearson"
    handle_outliers: Optional[bool] = False

class PCARequest(BaseModel):
    file_id: int
    columns: List[str]
    label_column: Optional[str] = None
    n_clusters: int = 3
    file_name: str = "PCA Analysis"