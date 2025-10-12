#!/usr/bin/env python3
"""
Hardware Detection Script
Version: 1.0.0

Detects available hardware and recommends optimal model configuration
Usage: python3 scripts/detect_hardware.py
"""

import sys
import platform
import json
from typing import Dict, Optional, Tuple

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    print("⚠️  PyTorch not installed. Install with: pip install torch")

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("⚠️  psutil not installed. Install with: pip install psutil")


def get_cpu_info() -> Dict:
    """Get CPU information"""
    info = {
        "platform": platform.system(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version()
    }
    
    if HAS_PSUTIL:
        info.update({
            "cpu_count_physical": psutil.cpu_count(logical=False),
            "cpu_count_logical": psutil.cpu_count(logical=True),
            "cpu_freq_mhz": psutil.cpu_freq().current if psutil.cpu_freq() else None
        })
    
    return info


def get_memory_info() -> Dict:
    """Get RAM information"""
    if not HAS_PSUTIL:
        return {"error": "psutil not available"}
    
    mem = psutil.virtual_memory()
    
    return {
        "total_gb": round(mem.total / (1024**3), 2),
        "available_gb": round(mem.available / (1024**3), 2),
        "used_gb": round(mem.used / (1024**3), 2),
        "percent_used": mem.percent
    }


def get_gpu_info() -> Optional[Dict]:
    """Get GPU information"""
    if not HAS_TORCH:
        return None
    
    if not torch.cuda.is_available():
        return {"available": False, "reason": "CUDA not available"}
    
    try:
        gpu_count = torch.cuda.device_count()
        devices = []
        
        for i in range(gpu_count):
            props = torch.cuda.get_device_properties(i)
            devices.append({
                "id": i,
                "name": torch.cuda.get_device_name(i),
                "total_memory_gb": round(props.total_memory / (1024**3), 2),
                "compute_capability": f"{props.major}.{props.minor}",
                "multi_processor_count": props.multi_processor_count
            })
        
        return {
            "available": True,
            "count": gpu_count,
            "devices": devices,
            "cuda_version": torch.version.cuda
        }
    except Exception as e:
        return {"available": False, "error": str(e)}


def get_disk_info() -> Dict:
    """Get disk space information"""
    if not HAS_PSUTIL:
        return {"error": "psutil not available"}
    
    try:
        disk = psutil.disk_usage('.')
        return {
            "total_gb": round(disk.total / (1024**3), 2),
            "free_gb": round(disk.free / (1024**3), 2),
            "used_gb": round(disk.used / (1024**3), 2),
            "percent_used": disk.percent
        }
    except Exception as e:
        return {"error": str(e)}


def recommend_configuration() -> Tuple[str, str, Dict]:
    """
    Recommend optimal configuration based on hardware
    Returns: (config_key, reason, config_details)
    """
    
    if not HAS_PSUTIL or not HAS_TORCH:
        return (
            "minimal",
            "Missing required packages (torch/psutil)",
            {
                "strategy": "basic",
                "model": "HooshvareLab/bert-fa-base-uncased",
                "device": "cpu",
                "batch_size": 1
            }
        )
    
    mem = get_memory_info()
    gpu = get_gpu_info()
    
    # Check GPU availability and capability
    if gpu and gpu.get("available") and gpu.get("devices"):
        device = gpu["devices"][0]
        vram_gb = device["total_memory_gb"]
        gpu_name = device["name"]
        
        if vram_gb >= 12:
            return (
                "high_end_gpu",
                f"{gpu_name} with {vram_gb}GB VRAM - High-end GPU configuration",
                {
                    "strategy": "full_fine_tuning",
                    "model": "persiannlp/gpt2-persian",
                    "device": "cuda",
                    "batch_size": 16,
                    "gradient_accumulation": 1,
                    "mixed_precision": "fp16",
                    "estimated_training_time": "2-4 hours"
                }
            )
        elif vram_gb >= 6:
            return (
                "mid_tier_gpu",
                f"{gpu_name} with {vram_gb}GB VRAM - Mid-tier GPU configuration",
                {
                    "strategy": "full_fine_tuning",
                    "model": "HooshvareLab/bert-fa-base-uncased",
                    "device": "cuda",
                    "batch_size": 8,
                    "gradient_accumulation": 2,
                    "mixed_precision": "fp16",
                    "estimated_training_time": "4-8 hours"
                }
            )
        elif vram_gb >= 4:
            return (
                "low_end_gpu",
                f"{gpu_name} with {vram_gb}GB VRAM - GPU with LoRA",
                {
                    "strategy": "lora",
                    "model": "HooshvareLab/bert-fa-base-uncased",
                    "device": "cuda",
                    "batch_size": 4,
                    "gradient_accumulation": 4,
                    "mixed_precision": "fp16",
                    "lora_config": {"r": 8, "alpha": 32},
                    "estimated_training_time": "6-12 hours"
                }
            )
    
    # CPU-only configurations
    ram_gb = mem.get("total_gb", 0)
    
    if ram_gb >= 16:
        return (
            "high_ram_cpu",
            f"CPU with {ram_gb}GB RAM - Adequate for small models",
            {
                "strategy": "lora",
                "model": "HooshvareLab/bert-fa-base-uncased",
                "device": "cpu",
                "batch_size": 2,
                "gradient_accumulation": 8,
                "mixed_precision": "no",
                "estimated_training_time": "24-48 hours",
                "warning": "Training will be very slow on CPU"
            }
        )
    elif ram_gb >= 8:
        return (
            "low_ram_cpu",
            f"CPU with {ram_gb}GB RAM - Limited configuration",
            {
                "strategy": "lora",
                "model": "HooshvareLab/bert-fa-base-uncased",
                "device": "cpu",
                "batch_size": 1,
                "gradient_accumulation": 16,
                "mixed_precision": "no",
                "estimated_training_time": "48-72 hours",
                "warning": "Very slow training. Consider using Google Colab (free GPU)"
            }
        )
    else:
        return (
            "insufficient",
            f"CPU with {ram_gb}GB RAM - Insufficient resources",
            {
                "strategy": "not_recommended",
                "recommendation": "Use Google Colab or cloud GPU service",
                "minimum_required": "8GB RAM",
                "error": "Insufficient resources for local training"
            }
        )


def print_hardware_report():
    """Print comprehensive hardware report"""
    print("\n" + "="*70)
    print("🖥️  HARDWARE DETECTION REPORT")
    print("="*70 + "\n")
    
    # CPU Info
    print("📊 CPU Information:")
    cpu = get_cpu_info()
    for key, value in cpu.items():
        print(f"   {key}: {value}")
    print()
    
    # Memory Info
    print("💾 Memory Information:")
    mem = get_memory_info()
    if "error" not in mem:
        print(f"   Total RAM: {mem['total_gb']} GB")
        print(f"   Available: {mem['available_gb']} GB")
        print(f"   Used: {mem['used_gb']} GB ({mem['percent_used']}%)")
    else:
        print(f"   ⚠️  {mem['error']}")
    print()
    
    # GPU Info
    print("🎮 GPU Information:")
    gpu = get_gpu_info()
    if gpu and gpu.get("available"):
        print(f"   CUDA Available: Yes")
        print(f"   CUDA Version: {gpu.get('cuda_version', 'unknown')}")
        print(f"   GPU Count: {gpu['count']}")
        for device in gpu.get("devices", []):
            print(f"\n   GPU {device['id']}: {device['name']}")
            print(f"      VRAM: {device['total_memory_gb']} GB")
            print(f"      Compute Capability: {device['compute_capability']}")
    else:
        reason = gpu.get("reason", "Unknown") if gpu else "PyTorch not available"
        print(f"   CUDA Available: No ({reason})")
    print()
    
    # Disk Info
    print("💿 Disk Space:")
    disk = get_disk_info()
    if "error" not in disk:
        print(f"   Total: {disk['total_gb']} GB")
        print(f"   Free: {disk['free_gb']} GB")
        print(f"   Used: {disk['used_gb']} GB ({disk['percent_used']}%)")
    else:
        print(f"   ⚠️  {disk['error']}")
    print()
    
    # Recommendation
    print("="*70)
    print("🎯 RECOMMENDED CONFIGURATION")
    print("="*70 + "\n")
    
    config_key, reason, config = recommend_configuration()
    
    print(f"Configuration: {config_key}")
    print(f"Reason: {reason}\n")
    
    print("Configuration Details:")
    for key, value in config.items():
        if isinstance(value, dict):
            print(f"   {key}:")
            for k, v in value.items():
                print(f"      {k}: {v}")
        else:
            print(f"   {key}: {value}")
    
    if config.get("warning"):
        print(f"\n⚠️  WARNING: {config['warning']}")
    
    print("\n" + "="*70 + "\n")
    
    # Return config as JSON for programmatic use
    return {
        "cpu": cpu,
        "memory": mem,
        "gpu": gpu,
        "disk": disk,
        "recommendation": {
            "config_key": config_key,
            "reason": reason,
            "config": config
        }
    }


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Detect hardware and recommend configuration")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--config-only", action="store_true", help="Output only recommended config")
    
    args = parser.parse_args()
    
    if args.json or args.config_only:
        result = print_hardware_report() if not args.config_only else {
            "recommendation": recommend_configuration()
        }
        print(json.dumps(result, indent=2))
    else:
        print_hardware_report()


if __name__ == "__main__":
    main()
