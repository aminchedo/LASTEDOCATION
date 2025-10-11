#!/usr/bin/env python3

import os
import json
import hashlib
from pathlib import Path

def count_files(directory):
    """Count non-empty files in directory recursively."""
    if not os.path.exists(directory):
        return 0
    
    count = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            if os.path.getsize(file_path) > 0:
                count += 1
    return count

def generate_checksums(datasets_dir, checksums_file):
    """Generate SHA256 checksums for all files in datasets directory."""
    checksums = []
    
    for root, dirs, files in os.walk(datasets_dir):
        for file in sorted(files):
            file_path = os.path.join(root, file)
            if os.path.getsize(file_path) > 0:
                with open(file_path, 'rb') as f:
                    sha256_hash = hashlib.sha256(f.read()).hexdigest()
                    relative_path = os.path.relpath(file_path, datasets_dir)
                    checksums.append(f"{sha256_hash}  {relative_path}")
    
    with open(checksums_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(checksums))
    
    return len(checksums)

def main():
    base_dir = Path("datasets")
    
    # Count files in each dataset directory
    metadata = {
        "text_persian_conversation_files": count_files(base_dir / "text" / "persian_conversation" / "data"),
        "speech_commonvoice_fa_files": count_files(base_dir / "speech" / "commonvoice_fa" / "data"),
        "speech_fleurs_fa_files": count_files(base_dir / "speech" / "fleurs_fa" / "data"),
        "tts_female_files": count_files(base_dir / "tts" / "kamtera_vits_female" / "model"),
        "tts_male_files": count_files(base_dir / "tts" / "kamtera_vits_male" / "model"),
    }
    
    # Create logs directory if it doesn't exist
    Path("logs").mkdir(exist_ok=True)
    
    # Write metadata to JSON file
    with open("logs/dataset_sources.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    
    # Generate checksums
    checksums_count = generate_checksums("datasets", "checksums/datasets.sha256.txt")
    
    print("Dataset acquisition verification:")
    print("=" * 40)
    for key, count in metadata.items():
        print(f"{key}: {count} files")
    
    print(f"\nGenerated checksums for {checksums_count} files")
    print("Metadata saved to logs/dataset_sources.json")
    print("Checksums saved to checksums/datasets.sha256.txt")
    
    # Check if all datasets have files
    all_have_files = all(count > 0 for count in metadata.values())
    if all_have_files:
        print("\n✅ All datasets verified successfully!")
        return 0
    else:
        print("\n❌ Some datasets are missing files!")
        return 1

if __name__ == "__main__":
    exit(main())
