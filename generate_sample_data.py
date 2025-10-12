#!/usr/bin/env python3
"""Generate sample datasets for testing"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_random_walk(n_points: int, start_lat: float, start_lon: float, seed: int = 42):
    """Generate realistic GPS trajectory using random walk"""
    np.random.seed(seed)
    
    data = {
        'timestamp': [],
        'latitude': [],
        'longitude': [],
        'feature_speed': [],
        'feature_bearing': []
    }
    
    lat, lon = start_lat, start_lon
    current_time = datetime(2025, 10, 12, 10, 0, 0)
    
    for i in range(n_points):
        # Random walk with momentum
        speed = np.random.uniform(0.5, 2.5)  # m/s
        bearing = np.random.uniform(0, 360)
        
        # Convert to lat/lon delta (approximate)
        lat_delta = (speed * np.cos(np.radians(bearing))) / 111320
        lon_delta = (speed * np.sin(np.radians(bearing))) / (111320 * np.cos(np.radians(lat)))
        
        lat += lat_delta
        lon += lon_delta
        
        data['timestamp'].append(current_time.isoformat() + 'Z')
        data['latitude'].append(lat)
        data['longitude'].append(lon)
        data['feature_speed'].append(speed)
        data['feature_bearing'].append(bearing)
        
        current_time += timedelta(seconds=60)
    
    return pd.DataFrame(data)

def generate_circular_path(n_points: int, center_lat: float, center_lon: float, radius: float = 0.01):
    """Generate circular GPS trajectory"""
    data = {
        'timestamp': [],
        'latitude': [],
        'longitude': [],
        'feature_speed': [],
        'feature_bearing': []
    }
    
    current_time = datetime(2025, 10, 12, 10, 0, 0)
    
    for i in range(n_points):
        angle = (i / n_points) * 2 * np.pi
        lat = center_lat + radius * np.sin(angle)
        lon = center_lon + radius * np.cos(angle)
        
        # Calculate bearing (tangent to circle)
        bearing = (angle * 180 / np.pi + 90) % 360
        speed = 1.5  # constant speed
        
        data['timestamp'].append(current_time.isoformat() + 'Z')
        data['latitude'].append(lat)
        data['longitude'].append(lon)
        data['feature_speed'].append(speed)
        data['feature_bearing'].append(bearing)
        
        current_time += timedelta(seconds=30)
    
    return pd.DataFrame(data)

def generate_commute_pattern(n_days: int = 5):
    """Generate realistic commute pattern"""
    data = {
        'timestamp': [],
        'latitude': [],
        'longitude': [],
        'feature_speed': [],
        'feature_bearing': []
    }
    
    # Home and work coordinates (Oslo example)
    home = (59.9139, 10.7522)
    work = (59.9111, 10.7579)
    
    for day in range(n_days):
        date = datetime(2025, 10, 12 + day)
        
        # Morning commute (8:00 AM, 30 minutes)
        morning_start = date.replace(hour=8, minute=0)
        for i in range(30):
            t = i / 30
            lat = home[0] + (work[0] - home[0]) * t + np.random.randn() * 0.0001
            lon = home[1] + (work[1] - home[1]) * t + np.random.randn() * 0.0001
            
            data['timestamp'].append((morning_start + timedelta(minutes=i)).isoformat() + 'Z')
            data['latitude'].append(lat)
            data['longitude'].append(lon)
            data['feature_speed'].append(np.random.uniform(0.5, 2.0))
            data['feature_bearing'].append(np.arctan2(work[1] - home[1], work[0] - home[0]) * 180 / np.pi)
        
        # Evening commute (5:00 PM, 30 minutes)
        evening_start = date.replace(hour=17, minute=0)
        for i in range(30):
            t = i / 30
            lat = work[0] + (home[0] - work[0]) * t + np.random.randn() * 0.0001
            lon = work[1] + (home[1] - work[1]) * t + np.random.randn() * 0.0001
            
            data['timestamp'].append((evening_start + timedelta(minutes=i)).isoformat() + 'Z')
            data['latitude'].append(lat)
            data['longitude'].append(lon)
            data['feature_speed'].append(np.random.uniform(0.5, 2.0))
            data['feature_bearing'].append(np.arctan2(home[1] - work[1], home[0] - work[0]) * 180 / np.pi)
    
    return pd.DataFrame(data)

def main():
    print("🎲 Generating Sample Datasets")
    print("=" * 60)
    
    # Random walk (Oslo city center)
    print("\n1. Random Walk (500 points)")
    df_walk = generate_random_walk(500, 59.9139, 10.7522)
    df_walk.to_csv('sample_random_walk.csv', index=False)
    print(f"   ✓ Saved: sample_random_walk.csv ({len(df_walk)} rows)")
    
    # Circular path
    print("\n2. Circular Path (200 points)")
    df_circle = generate_circular_path(200, 59.9139, 10.7522)
    df_circle.to_csv('sample_circular_path.csv', index=False)
    print(f"   ✓ Saved: sample_circular_path.csv ({len(df_circle)} rows)")
    
    # Commute pattern
    print("\n3. Commute Pattern (5 days)")
    df_commute = generate_commute_pattern(5)
    df_commute.to_csv('sample_commute_pattern.csv', index=False)
    print(f"   ✓ Saved: sample_commute_pattern.csv ({len(df_commute)} rows)")
    
    # Large dataset
    print("\n4. Large Dataset (5000 points)")
    df_large = generate_random_walk(5000, 59.9139, 10.7522, seed=123)
    df_large.to_csv('sample_large_dataset.csv', index=False)
    print(f"   ✓ Saved: sample_large_dataset.csv ({len(df_large)} rows)")
    
    print("\n" + "=" * 60)
    print("✅ All sample datasets generated")
    print("\nUsage:")
    print("  curl -X POST http://localhost:3001/api/models/train \\")
    print("    -F 'file=@sample_random_walk.csv'")

if __name__ == '__main__':
    main()
