#!/usr/bin/env python3
"""
Simulation fallback training script (works without PyTorch)
This is used when PyTorch is not available, to demonstrate the job system.

Usage:
  python scripts/train_simulation_fallback.py --job_id JOB123 --epochs 3 --batch-size 16 --lr 0.01
"""
import argparse
import json
import os
import sys
import time
import random
from pathlib import Path

def write_status(job_id, status_dict):
    """Write job status to artifacts/jobs/<job_id>.json"""
    out = Path("artifacts/jobs")
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{job_id}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(status_dict, f, ensure_ascii=False, indent=2)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--job_id", required=True)
    parser.add_argument("--dataset", required=False, default=None)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-2)
    args = parser.parse_args()

    job_id = args.job_id
    
    # Initial status
    status = {
        "job_id": job_id,
        "status": "STARTING",
        "progress": 0.0,
        "epoch": 0,
        "loss": None,
        "message": "Initializing (simulation mode - PyTorch not available)",
        "simulation": True,
        "created_at": time.time()
    }
    write_status(job_id, status)
    time.sleep(0.5)

    # Simulate dataset loading
    status.update({
        "status": "LOADING",
        "message": "Loading dataset (simulated)"
    })
    write_status(job_id, status)
    time.sleep(0.5)

    # Simulate training
    total_steps = args.epochs * 10  # 10 steps per epoch
    step = 0
    
    for epoch in range(1, args.epochs + 1):
        for batch in range(10):
            step += 1
            
            # Simulate decreasing loss
            loss = max(0.01, 2.0 - step * 0.05 + random.uniform(-0.05, 0.05))
            prog = min(100.0, (step / float(total_steps)) * 100.0)
            
            status.update({
                "status": "RUNNING",
                "progress": round(prog, 2),
                "epoch": epoch,
                "step": step,
                "total_steps": total_steps,
                "loss": round(loss, 6),
                "message": f"Training epoch {epoch}/{args.epochs} (simulation)"
            })
            
            # Write status every few steps
            if step % 3 == 0:
                write_status(job_id, status)
            
            time.sleep(0.3)  # Simulate processing time
        
        # End of epoch
        write_status(job_id, status)

    # Create dummy model file
    model_dir = Path("models")
    model_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = model_dir / f"{job_id}.txt"
    with open(ckpt_path, "w") as f:
        f.write("SIMULATED MODEL CHECKPOINT\n")
        f.write(f"This is a simulation. Install PyTorch for real training.\n")
        f.write(f"Job ID: {job_id}\n")
        f.write(f"Epochs: {args.epochs}\n")
        f.write(f"Final Loss: {loss:.6f}\n")
    
    # Final status
    status.update({
        "status": "COMPLETED",
        "progress": 100.0,
        "message": "Simulation completed (install PyTorch for real training)",
        "checkpoint": str(ckpt_path),
        "finished_at": time.time()
    })
    write_status(job_id, status)
    
    print(json.dumps(status))
    sys.exit(0)

if __name__ == "__main__":
    main()
