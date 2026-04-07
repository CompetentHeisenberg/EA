from pydantic import BaseModel
from typing import List, Dict, Any


class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    n_clusters: int = 3
    file_name: str = "Unknown file"

class AnalysisResponse(BaseModel):
    clusters: List[int]
    pca_data: List[Dict[str, Any]]
    variance: List[float]


class CorrelationRequest(BaseModel):
    data: Dict[str, List[float]]
    file_name: str = "Unknown file"