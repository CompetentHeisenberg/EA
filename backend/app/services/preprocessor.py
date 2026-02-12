import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

class Preprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='mean')

    def clean_and_validate(self, df: pd.DataFrame):
        df_numeric = df.select_dtypes(include=[np.number])
        
        if df_numeric.empty:
            raise ValueError("У файлі немає числових колонок!")
            
        data_imputed = self.imputer.fit_transform(df_numeric)
        return pd.DataFrame(data_imputed, columns=df_numeric.columns)

    def scale_data(self, df: pd.DataFrame):
        scaled_data = self.scaler.fit_transform(df)
        return pd.DataFrame(scaled_data, columns=df.columns)