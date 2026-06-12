import pandas as pd
import numpy as np
import re
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.impute import KNNImputer

class Preprocessor:
    def __init__(self):
        self.imputer = KNNImputer(n_neighbors=5)

    def clean_financial_strings(self, df: pd.DataFrame) -> pd.DataFrame:
        df_copy = df.copy()
        for col in df_copy.columns:
            if df_copy[col].dtype == 'object':
                has_digits = df_copy[col].astype(str).str.contains(r'\d', regex=True).any()
                if has_digits:
                    cleaned_series = df_copy[col].astype(str).str.replace(r'[^\d.\-]', '', regex=True)
                    df_copy[col] = pd.to_numeric(cleaned_series, errors='coerce')
        return df_copy

    def clean_and_validate(self, df: pd.DataFrame, handle_outliers: bool = False):
        df = self.clean_financial_strings(df)
        
        df_numeric = df.select_dtypes(include=[np.number]).copy()

        if df_numeric.empty:
            raise ValueError("There are no numeric columns in the file after cleaning")

        constant_cols = [c for c in df_numeric.columns if df_numeric[c].nunique(dropna=True) <= 1]
        if constant_cols:
            df_numeric = df_numeric.drop(columns=constant_cols)

        if df_numeric.empty:
            raise ValueError("All columns are constant after cleaning")

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