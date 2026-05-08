import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.impute import KNNImputer

class Preprocessor:
    def __init__(self):
        self.imputer = KNNImputer(n_neighbors=5)

    def clean_and_validate(self, df: pd.DataFrame, handle_outliers: bool = False):
        df_numeric = df.select_dtypes(include=[np.number]).copy()
        
        if df_numeric.empty:
            raise ValueError("There are no numeric columns in the file!")

        if handle_outliers:
            for col in df_numeric.columns:
                lower = df_numeric[col].quantile(0.01)
                upper = df_numeric[col].quantile(0.99)
                df_numeric[col] = np.clip(df_numeric[col], lower, upper)
            
        data_imputed = self.imputer.fit_transform(df_numeric)
        return pd.DataFrame(data_imputed, columns=df_numeric.columns)

    def scale_data(self, df: pd.DataFrame, scaler_type: str = "standard"):
        if scaler_type == "robust":
            scaler = RobustScaler()
        else:
            scaler = StandardScaler()
            
        scaled_data = scaler.fit_transform(df)
        return pd.DataFrame(scaled_data, columns=df.columns)