#!/usr/bin/env python3
"""
Minimal, safe PyTorch training script used as a real training runner.
It reads a small CSV (or JSONL) dataset with two numeric columns: 'x' and 'y'
and trains a tiny regression model for demonstration.

Usage:
  python scripts/train_minimal_job.py --job_id JOB123 --dataset data/sample.csv --epochs 3 --batch-size 16 --lr 0.01
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import TensorDataset, DataLoader
except Exception as e:
    print(f"ERROR: PyTorch not installed: {e}", file=sys.stderr)
    sys.exit(2)

import csv
import random
import numpy as np

def safe_mkdir(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)

def write_status(job_id, status_dict):
    """Write job status to artifacts/jobs/<job_id>.json"""
    out = Path("artifacts/jobs")
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{job_id}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(status_dict, f, ensure_ascii=False, indent=2)

def load_tabular_dataset(dataset_path):
    """Load CSV/JSONL dataset or generate synthetic data"""
    X = []
    y = []
    
    if dataset_path:
        p = Path(dataset_path)
        if not p.exists():
            raise FileNotFoundError(str(p))
        
        if p.suffix.lower() in [".csv", ".tsv"]:
            delimiter = "," if p.suffix.lower() == ".csv" else "\t"
            with open(p, newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile, delimiter=delimiter)
                rows = list(reader)
                keys = list(reader.fieldnames or [])
                
                # Prefer columns named x and y
                if "x" in keys and "y" in keys:
                    xs = [float(r["x"]) for r in rows]
                    ys = [float(r["y"]) for r in rows]
                    X = [[v] for v in xs]
                    y = ys
                else:
                    # Pick first two numeric columns
                    numeric_cols = []
                    for k in keys:
                        try:
                            float(rows[0][k])
                            numeric_cols.append(k)
                        except:
                            continue
                    if len(numeric_cols) >= 2:
                        for r in rows:
                            X.append([float(r[numeric_cols[0]])])
                            y.append(float(r[numeric_cols[1]]))
                    else:
                        # Fallback to synthetic
                        X, y = generate_synthetic_data(100)
        else:
            # Not CSV: use synthetic
            X, y = generate_synthetic_data(100)
    else:
        # No dataset provided: generate synthetic
        X, y = generate_synthetic_data(100)
    
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.float32).reshape(-1, 1)
    return X, y

def generate_synthetic_data(n_samples=100):
    """Generate simple y = 2x + noise synthetic dataset"""
    X = []
    y = []
    for i in range(n_samples):
        xv = random.random()
        X.append([xv])
        y.append(2.0 * xv + 0.1 * random.random())
    return X, y

class TinyRegressor(nn.Module):
    """Minimal neural network for regression"""
    def __init__(self, in_dim=1, hidden=8):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, 1)
        )
    
    def forward(self, x):
        return self.net(x)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--job_id", required=True, help="Unique job identifier")
    parser.add_argument("--dataset", required=False, default=None, help="Path to dataset CSV")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Training batch size")
    parser.add_argument("--lr", type=float, default=1e-2, help="Learning rate")
    args = parser.parse_args()

    job_id = args.job_id
    
    # Initial status
    status = {
        "job_id": job_id,
        "status": "STARTING",
        "progress": 0.0,
        "epoch": 0,
        "loss": None,
        "message": "Initializing",
        "created_at": time.time()
    }
    write_status(job_id, status)

    try:
        # Load dataset
        X, y = load_tabular_dataset(args.dataset)
        status.update({
            "status": "LOADING",
            "message": f"Loaded {len(X)} samples"
        })
        write_status(job_id, status)
        
    except Exception as e:
        status.update({
            "status": "ERROR",
            "message": f"Dataset load error: {e}"
        })
        write_status(job_id, status)
        sys.exit(3)

    # Setup training
    device = torch.device("cpu")
    ds = TensorDataset(torch.from_numpy(X), torch.from_numpy(y))
    loader = DataLoader(ds, batch_size=args.batch_size, shuffle=True)

    model = TinyRegressor(in_dim=X.shape[1])
    model.to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)

    total_steps = args.epochs * max(1, len(loader))
    step = 0
    
    # Training loop
    for epoch in range(1, args.epochs + 1):
        epoch_loss = 0.0
        model.train()
        
        for xb, yb in loader:
            xb = xb.to(device)
            yb = yb.to(device)
            
            optimizer.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            optimizer.step()
            
            epoch_loss += float(loss.item())
            step += 1
            
            # Calculate progress
            prog = min(100.0, (step / float(total_steps)) * 100.0)
            
            # Update status
            status.update({
                "status": "RUNNING",
                "progress": round(prog, 3),
                "epoch": epoch,
                "step": step,
                "total_steps": total_steps,
                "loss": round(epoch_loss / max(1, step), 6),
                "message": f"Training epoch {epoch}/{args.epochs}"
            })
            
            # Write status periodically
            if step % 5 == 0:
                write_status(job_id, status)
        
        # End of epoch
        avg_loss = epoch_loss / max(1, len(loader))
        status.update({
            "epoch": epoch,
            "loss": round(avg_loss, 6)
        })
        write_status(job_id, status)
        
        # Short sleep to make progress observable
        time.sleep(0.2)

    # Training finished - save checkpoint
    model_dir = Path("models")
    model_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = model_dir / f"{job_id}.pt"
    torch.save(model.state_dict(), str(ckpt_path))
    
    # Final status
    status.update({
        "status": "COMPLETED",
        "progress": 100.0,
        "message": "Training completed successfully",
        "checkpoint": str(ckpt_path),
        "finished_at": time.time()
    })
    write_status(job_id, status)
    
    print(json.dumps(status))
    sys.exit(0)

if __name__ == "__main__":
    main()
