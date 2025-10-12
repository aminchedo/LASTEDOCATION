import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from dateutil import parser
import joblib
from datetime import datetime
from config import settings

def validate_csv(df):
    errors = []
    
    if 'latitude' not in df.columns or 'longitude' not in df.columns:
        errors.append('Missing latitude or longitude columns')
        return errors
    
    if not df['latitude'].between(-90, 90).all():
        errors.append('Latitude must be between -90 and 90')
    
    if not df['longitude'].between(-180, 180).all():
        errors.append('Longitude must be between -180 and 180')
    
    if len(df) < 10:
        errors.append('Need at least 10 rows')
    
    if df['latitude'].isnull().any() or df['longitude'].isnull().any():
        errors.append('Latitude/longitude cannot be null')
    
    return errors

def extract_time_features(df):
    if 'timestamp' not in df.columns:
        return df
    
    try:
        ts = pd.to_datetime(df['timestamp'])
    except:
        ts = df['timestamp'].apply(lambda x: parser.isoparse(str(x)) if pd.notna(x) else None)
    
    df['hour'] = ts.dt.hour
    df['day_of_week'] = ts.dt.dayofweek
    df['month'] = ts.dt.month
    df = df.drop('timestamp', axis=1)
    
    return df

def train_model(df):
    errors = validate_csv(df)
    if errors:
        raise ValueError('; '.join(errors))
    
    df = extract_time_features(df)
    
    feature_cols = [c for c in df.columns if c not in ['latitude', 'longitude', 'user_id']]
    X = df[feature_cols]
    y = df[['latitude', 'longitude']]
    
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=settings.TEST_SIZE, random_state=settings.RANDOM_SEED
    )
    
    rf = RandomForestRegressor(
        n_estimators=settings.N_ESTIMATORS,
        random_state=settings.RANDOM_SEED,
        n_jobs=settings.N_JOBS
    )
    model = MultiOutputRegressor(rf)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    rmse_lat = np.sqrt(mean_squared_error(y_test.iloc[:, 0], y_pred[:, 0]))
    rmse_lon = np.sqrt(mean_squared_error(y_test.iloc[:, 1], y_pred[:, 1]))
    rmse_combined = np.sqrt((rmse_lat**2 + rmse_lon**2) / 2)
    
    metrics = {
        'rmse_lat': float(rmse_lat),
        'rmse_lon': float(rmse_lon),
        'rmse_combined': float(rmse_combined),
        'mae_lat': float(mean_absolute_error(y_test.iloc[:, 0], y_pred[:, 0])),
        'r2_lat': float(r2_score(y_test.iloc[:, 0], y_pred[:, 0]))
    }
    
    return {
        'model': model,
        'imputer': imputer,
        'scaler': scaler,
        'feature_cols': feature_cols
    }, metrics

def save_model(artifacts, job_id):
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    path = settings.MODELS_DIR / f'model_{timestamp}.pkl'
    joblib.dump(artifacts, path)
    return str(path)

def load_model(path):
    return joblib.load(path)
