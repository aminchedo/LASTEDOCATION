#!/usr/bin/env python3
"""Quick local test for ML pipeline"""
import pandas as pd
from modeling import train_model, save_model, load_model, extract_time_features
from pathlib import Path

# Test data
data = {
    'timestamp': ['2025-10-12T10:00:00Z'] * 15,
    'latitude': [59.9139 + i*0.0001 for i in range(15)],
    'longitude': [10.7522 + i*0.0001 for i in range(15)],
    'feature_speed': [1.2, 0.5, 1.0, 0.8, 1.5] * 3,
    'feature_bearing': [270, 90, 180, 45, 135] * 3
}

df = pd.DataFrame(data)
print(f"📊 Training with {len(df)} rows...")

# Train
artifacts, metrics = train_model(df)
print(f"✓ Training complete")
print(f"  RMSE Combined: {metrics['rmse_combined']:.6f}")
print(f"  RMSE Lat: {metrics['rmse_lat']:.6f}")
print(f"  RMSE Lon: {metrics['rmse_lon']:.6f}")
print(f"  R² Score: {metrics['r2_lat']:.4f}")

# Save
model_path = save_model(artifacts, 'test-job')
print(f"✓ Model saved: {model_path}")

# Test prediction
print(f"\n🔮 Testing prediction...")
features = {'timestamp': '2025-10-12T12:00:00Z', 'feature_speed': 1.2, 'feature_bearing': 270}
df_pred = pd.DataFrame([features])
df_pred = extract_time_features(df_pred)

for col in artifacts['feature_cols']:
    if col not in df_pred.columns:
        df_pred[col] = 0

X = df_pred[artifacts['feature_cols']]
X_imputed = artifacts['imputer'].transform(X)
X_scaled = artifacts['scaler'].transform(X_imputed)
pred = artifacts['model'].predict(X_scaled)[0]

print(f"✓ Predicted: {pred[0]:.6f}°, {pred[1]:.6f}°")
print(f"\n✅ All tests passed!")
