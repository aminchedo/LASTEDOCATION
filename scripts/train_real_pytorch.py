#!/usr/bin/env python3
"""
Real PyTorch-based training script for Persian language models.
Replaces the simulation-based training with actual model training.

Usage:
    python3 train_real_pytorch.py --model-name HooshvareLab/bert-fa-base-uncased \
                                   --dataset-path combined.jsonl \
                                   --output-dir models/persian-chat \
                                   --epochs 3 \
                                   --batch-size 4 \
                                   --learning-rate 5e-5
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any
import time

# Try to import PyTorch and Transformers
try:
    import torch
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
        Trainer,
        DataCollatorForLanguageModeling,
        TrainerCallback
    )
    from datasets import load_dataset, Dataset
    PYTORCH_AVAILABLE = True
except ImportError as e:
    PYTORCH_AVAILABLE = False
    print(f"Warning: PyTorch/Transformers not available: {e}")
    print("Install with: pip install torch transformers datasets accelerate")


class ProgressCallback(TrainerCallback):
    """Custom callback to report training progress"""
    
    def __init__(self, output_file: str):
        self.output_file = output_file
        self.start_time = time.time()
    
    def on_log(self, args, state, control, logs=None, **kwargs):
        """Called when the trainer logs metrics"""
        if logs:
            progress_data = {
                "step": state.global_step,
                "total_steps": state.max_steps,
                "epoch": state.epoch,
                "loss": logs.get("loss", 0),
                "learning_rate": logs.get("learning_rate", 0),
                "elapsed_time": time.time() - self.start_time,
                "timestamp": time.time()
            }
            
            # Write progress to file
            with open(self.output_file, 'w') as f:
                json.dump(progress_data, f, indent=2)
            
            # Print to stdout for backend to capture
            print(f"[PROGRESS] Step {state.global_step}/{state.max_steps} - "
                  f"Loss: {logs.get('loss', 0):.4f} - "
                  f"LR: {logs.get('learning_rate', 0):.2e}")
            sys.stdout.flush()


def load_and_prepare_dataset(dataset_path: str, tokenizer, max_length: int = 512):
    """Load and tokenize the dataset"""
    print(f"📂 Loading dataset from: {dataset_path}")
    
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")
    
    # Load JSONL dataset
    dataset = load_dataset('json', data_files=dataset_path, split='train')
    
    print(f"✅ Loaded {len(dataset)} samples")
    
    # Check dataset format
    sample = dataset[0]
    if 'question' in sample and 'answer' in sample:
        # Convert Q&A format to text format
        def format_qa(example):
            return {
                'text': f"سوال: {example['question']}\nپاسخ: {example['answer']}"
            }
        dataset = dataset.map(format_qa)
    elif 'text' not in sample:
        raise ValueError("Dataset must have 'text' field or 'question'/'answer' fields")
    
    # Tokenize dataset
    def tokenize_function(examples):
        return tokenizer(
            examples['text'],
            truncation=True,
            max_length=max_length,
            padding='max_length',
            return_tensors=None
        )
    
    print("🔄 Tokenizing dataset...")
    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=dataset.column_names,
        desc="Tokenizing"
    )
    
    print(f"✅ Tokenization complete")
    
    return tokenized_dataset


def train_model_real(
    model_name: str,
    dataset_path: str,
    output_dir: str,
    epochs: int = 3,
    batch_size: int = 4,
    learning_rate: float = 5e-5,
    max_length: int = 512,
    save_steps: int = 100,
    logging_steps: int = 10,
    use_gpu: bool = False,
    run_id: str = "default"
):
    """Real PyTorch training with HuggingFace Transformers"""
    
    if not PYTORCH_AVAILABLE:
        raise RuntimeError("PyTorch and Transformers are required but not installed. "
                          "Install with: pip install torch transformers datasets accelerate")
    
    print("="*80)
    print("🚀 Starting Real PyTorch Training")
    print("="*80)
    print(f"📦 Model: {model_name}")
    print(f"📂 Dataset: {dataset_path}")
    print(f"📁 Output: {output_dir}")
    print(f"⚙️  Epochs: {epochs}, Batch Size: {batch_size}, LR: {learning_rate}")
    print(f"🖥️  Device: {'GPU' if use_gpu and torch.cuda.is_available() else 'CPU'}")
    print("="*80)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Progress file for real-time updates
    progress_file = f"training_progress_{run_id}.json"
    
    # Load tokenizer
    print("\n📥 Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    # Add pad token if not present
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    print(f"✅ Tokenizer loaded (vocab size: {len(tokenizer)})")
    
    # Load model
    print("\n📥 Loading model...")
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # Get model size
    param_count = sum(p.numel() for p in model.parameters())
    print(f"✅ Model loaded ({param_count:,} parameters)")
    
    # Load and prepare dataset
    tokenized_dataset = load_and_prepare_dataset(dataset_path, tokenizer, max_length)
    
    # Data collator for language modeling
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False  # Causal LM (not masked LM)
    )
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        learning_rate=learning_rate,
        logging_steps=logging_steps,
        save_steps=save_steps,
        save_total_limit=3,
        report_to="none",  # Disable wandb/tensorboard
        no_cuda=not use_gpu or not torch.cuda.is_available(),
        logging_dir=os.path.join(output_dir, 'logs'),
        save_strategy="steps",
        evaluation_strategy="no",  # No validation set
        load_best_model_at_end=False,
        metric_for_best_model="loss",
        greater_is_better=False,
        warmup_steps=100,
        weight_decay=0.01,
        push_to_hub=False,
        disable_tqdm=False,
    )
    
    # Create trainer
    print("\n🏋️  Creating trainer...")
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=data_collator,
        tokenizer=tokenizer,
        callbacks=[ProgressCallback(progress_file)]
    )
    
    print(f"✅ Trainer initialized")
    print(f"\n{'='*80}")
    print("🎯 Starting Training")
    print(f"{'='*80}\n")
    
    # Train the model
    train_result = trainer.train()
    
    # Save final model
    print("\n💾 Saving final model...")
    trainer.save_model()
    tokenizer.save_pretrained(output_dir)
    
    # Save training stats
    stats_file = os.path.join(output_dir, 'training_stats.json')
    with open(stats_file, 'w') as f:
        json.dump({
            "final_loss": train_result.training_loss,
            "total_steps": train_result.global_step,
            "epochs_completed": epochs,
            "model_name": model_name,
            "dataset_path": dataset_path,
            "parameters": param_count,
            "training_time": train_result.metrics.get('train_runtime', 0),
            "samples_per_second": train_result.metrics.get('train_samples_per_second', 0)
        }, f, indent=2)
    
    print(f"\n{'='*80}")
    print("✅ Training Complete!")
    print(f"{'='*80}")
    print(f"📊 Final Loss: {train_result.training_loss:.4f}")
    print(f"⏱️  Training Time: {train_result.metrics.get('train_runtime', 0):.2f}s")
    print(f"💾 Model saved to: {output_dir}")
    print(f"📈 Stats saved to: {stats_file}")
    
    # Clean up progress file
    if os.path.exists(progress_file):
        os.remove(progress_file)
    
    return output_dir


def train_model_simulation(
    model_name: str,
    dataset_path: str,
    output_dir: str,
    epochs: int = 3,
    batch_size: int = 4,
    learning_rate: float = 5e-5,
    run_id: str = "default"
):
    """Fallback simulation for when PyTorch is not available"""
    
    print("⚠️  WARNING: Running in SIMULATION mode (PyTorch not available)")
    print("Install PyTorch with: pip install torch transformers datasets")
    print("")
    
    import random
    
    os.makedirs(output_dir, exist_ok=True)
    progress_file = f"training_progress_{run_id}.json"
    
    total_steps = epochs * 100
    
    for epoch in range(epochs):
        print(f"\n📊 Epoch {epoch + 1}/{epochs}")
        
        for step in range(100):
            # Simulated metrics
            current_step = epoch * 100 + step
            loss = max(0.1, 2.0 - current_step * 0.01 + random.uniform(-0.1, 0.1))
            
            # Write progress
            progress_data = {
                "step": current_step,
                "total_steps": total_steps,
                "epoch": epoch + 1,
                "loss": loss,
                "learning_rate": learning_rate,
                "timestamp": time.time()
            }
            
            with open(progress_file, 'w') as f:
                json.dump(progress_data, f, indent=2)
            
            if step % 10 == 0:
                print(f"[PROGRESS] Step {current_step}/{total_steps} - Loss: {loss:.4f}")
            
            time.sleep(0.05)  # Simulate processing time
    
    # Save dummy model files
    config_file = os.path.join(output_dir, 'config.json')
    with open(config_file, 'w') as f:
        json.dump({
            "model_type": "gpt2",
            "vocab_size": 50257,
            "simulation": True,
            "warning": "This is a simulated model. Install PyTorch for real training."
        }, f, indent=2)
    
    print(f"\n✅ Simulation complete. Model saved to: {output_dir}")
    print("⚠️  This is NOT a real trained model. Install PyTorch for actual training.")
    
    if os.path.exists(progress_file):
        os.remove(progress_file)


def parse_args():
    parser = argparse.ArgumentParser(description='Real PyTorch-based Persian model training')
    parser.add_argument('--model-name', type=str, default='HooshvareLab/bert-fa-base-uncased',
                      help='Base model name from HuggingFace')
    parser.add_argument('--dataset-path', type=str, default='combined.jsonl',
                      help='Path to training dataset (JSONL format)')
    parser.add_argument('--output-dir', type=str, default='models/persian-chat',
                      help='Output directory for trained model')
    parser.add_argument('--epochs', type=int, default=3,
                      help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=4,
                      help='Training batch size')
    parser.add_argument('--learning-rate', type=float, default=5e-5,
                      help='Learning rate')
    parser.add_argument('--max-length', type=int, default=512,
                      help='Maximum sequence length')
    parser.add_argument('--save-steps', type=int, default=100,
                      help='Save checkpoint every N steps')
    parser.add_argument('--logging-steps', type=int, default=10,
                      help='Log metrics every N steps')
    parser.add_argument('--use-gpu', action='store_true',
                      help='Use GPU if available')
    parser.add_argument('--run-id', type=str, default='default',
                      help='Unique run identifier')
    
    return parser.parse_args()


def main():
    args = parse_args()
    
    try:
        if PYTORCH_AVAILABLE:
            train_model_real(
                model_name=args.model_name,
                dataset_path=args.dataset_path,
                output_dir=args.output_dir,
                epochs=args.epochs,
                batch_size=args.batch_size,
                learning_rate=args.learning_rate,
                max_length=args.max_length,
                save_steps=args.save_steps,
                logging_steps=args.logging_steps,
                use_gpu=args.use_gpu,
                run_id=args.run_id
            )
        else:
            # Fallback to simulation
            train_model_simulation(
                model_name=args.model_name,
                dataset_path=args.dataset_path,
                output_dir=args.output_dir,
                epochs=args.epochs,
                batch_size=args.batch_size,
                learning_rate=args.learning_rate,
                run_id=args.run_id
            )
        
        return 0
    
    except Exception as e:
        print(f"\n❌ Training failed: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
