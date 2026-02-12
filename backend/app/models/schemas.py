from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    n_clusters: int = 3

class AnalysisResponse(BaseModel):
    clusters: List[int]
    pca_data: List[Dict[str, float]]
    variance: List[float]