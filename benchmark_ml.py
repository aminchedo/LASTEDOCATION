#!/usr/bin/env python3
"""Performance benchmark for ML service"""
import time
import pandas as pd
import requests
from pathlib import Path
import statistics

ML_URL = "http://localhost:8000"

def generate_dataset(rows: int) -> pd.DataFrame:
    """Generate test dataset"""
    import numpy as np
    return pd.DataFrame({
        'timestamp': ['2025-10-12T10:00:00Z'] * rows,
        'latitude': 59.9139 + np.random.randn(rows) * 0.01,
        'longitude': 10.7522 + np.random.randn(rows) * 0.01,
        'feature_speed': np.random.uniform(0.5, 2.0, rows),
        'feature_bearing': np.random.uniform(0, 360, rows)
    })

def benchmark_training(sizes: list[int]):
    """Benchmark training with different dataset sizes"""
    print("=" * 60)
    print("TRAINING BENCHMARK")
    print("=" * 60)
    
    results = []
    for size in sizes:
        print(f"\n📊 Testing with {size} rows...")
        
        # Generate data
        df = generate_dataset(size)
        csv_path = Path(f'/tmp/bench_{size}.csv')
        df.to_csv(csv_path, index=False)
        
        # Upload and train
        start = time.time()
        with open(csv_path, 'rb') as f:
            response = requests.post(f'{ML_URL}/train', files={'file': f})
        
        if response.status_code != 200:
            print(f"  ❌ Failed: {response.text}")
            continue
        
        job_id = response.json()['job_id']
        
        # Poll until complete
        while True:
            status_response = requests.get(f'{ML_URL}/train/status/{job_id}')
            status = status_response.json()
            
            if status['status'] == 'completed':
                end = time.time()
                duration = end - start
                
                print(f"  ✓ Completed in {duration:.2f}s")
                print(f"    RMSE: {status['metrics']['rmse_combined']:.6f}")
                
                results.append({
                    'rows': size,
                    'duration': duration,
                    'rmse': status['metrics']['rmse_combined']
                })
                break
            elif status['status'] == 'failed':
                print(f"  ❌ Training failed: {status.get('error')}")
                break
            
            time.sleep(1)
        
        csv_path.unlink()
    
    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    for r in results:
        print(f"  {r['rows']:>6} rows: {r['duration']:>6.2f}s  (RMSE: {r['rmse']:.6f})")
    
    return results

def benchmark_prediction(n_requests: int):
    """Benchmark prediction latency"""
    print("\n" + "=" * 60)
    print(f"PREDICTION BENCHMARK ({n_requests} requests)")
    print("=" * 60)
    
    latencies = []
    
    for i in range(n_requests):
        payload = {
            'features': {
                'timestamp': '2025-10-12T12:00:00Z',
                'feature_speed': 1.2,
                'feature_bearing': 270
            }
        }
        
        start = time.time()
        response = requests.post(f'{ML_URL}/predict', json=payload)
        end = time.time()
        
        if response.status_code == 200:
            latency = (end - start) * 1000  # ms
            latencies.append(latency)
            
            if (i + 1) % 10 == 0:
                print(f"  Progress: {i+1}/{n_requests}")
        else:
            print(f"  ❌ Request {i+1} failed: {response.text}")
    
    if latencies:
        print("\n" + "=" * 60)
        print("PREDICTION LATENCY")
        print("=" * 60)
        print(f"  Mean:   {statistics.mean(latencies):>8.2f} ms")
        print(f"  Median: {statistics.median(latencies):>8.2f} ms")
        print(f"  Min:    {min(latencies):>8.2f} ms")
        print(f"  Max:    {max(latencies):>8.2f} ms")
        print(f"  P95:    {statistics.quantiles(latencies, n=20)[18]:>8.2f} ms")
        print(f"  P99:    {statistics.quantiles(latencies, n=100)[98]:>8.2f} ms")
    
    return latencies

def main():
    print("\n🚀 ML Service Performance Benchmark")
    print("=" * 60)
    
    # Check if service is running
    try:
        response = requests.get(f'{ML_URL}/health', timeout=5)
        if response.status_code != 200:
            print("❌ ML service not healthy")
            return
    except requests.exceptions.RequestException:
        print("❌ ML service not reachable. Start it with:")
        print("   cd ml_service && uvicorn app:app --port 8000")
        return
    
    print("✓ ML service is running\n")
    
    # Training benchmark
    training_sizes = [50, 100, 500, 1000]
    training_results = benchmark_training(training_sizes)
    
    # Prediction benchmark
    prediction_results = benchmark_prediction(100)
    
    print("\n" + "=" * 60)
    print("✅ BENCHMARK COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    main()
