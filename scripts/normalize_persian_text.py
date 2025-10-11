#!/usr/bin/env python3

import json
import pathlib
from typing import Dict, Any, List

def normalize_persian_conversation_dataset():
    """Convert Persian conversational dataset to unified JSONL format."""
    
    input_dir = pathlib.Path("datasets/text/persian_conversation/data")
    output_file = pathlib.Path("datasets/text/persian_conversation/combined.jsonl")
    
    if not input_dir.exists():
        print(f"Input directory {input_dir} does not exist")
        return 0
    
    count = 0
    with output_file.open("w", encoding="utf-8") as w:
        # Process all JSON files in the dataset directory
        for json_file in input_dir.rglob("*.json"):
            try:
                with json_file.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                
                # Handle nested array structure (Persian conversational dataset format)
                if isinstance(data, list):
                    for conversation_group in data:
                        if isinstance(conversation_group, list):
                            # Each group contains multiple conversation turns
                            messages = []
                            for i, turn in enumerate(conversation_group):
                                if isinstance(turn, str):
                                    # Alternate between user and assistant
                                    role = "user" if i % 2 == 0 else "assistant"
                                    messages.append({"role": role, "content": turn})
                                elif isinstance(turn, list) and len(turn) >= 2:
                                    # Handle question-answer pairs
                                    messages.append({"role": "user", "content": turn[0]})
                                    messages.append({"role": "assistant", "content": turn[1]})
                            
                            if messages:
                                chat_entry = {"messages": messages}
                                w.write(json.dumps(chat_entry, ensure_ascii=False) + "\n")
                                count += 1
                
                elif isinstance(data, dict):
                    # Single conversation object
                    messages = []
                    
                    if "messages" in data:
                        # Already in chat format
                        chat_entry = {"messages": data["messages"]}
                        w.write(json.dumps(chat_entry, ensure_ascii=False) + "\n")
                        count += 1
                    elif "question" in data and "answer" in data:
                        messages = [
                            {"role": "user", "content": data["question"]},
                            {"role": "assistant", "content": data["answer"]}
                        ]
                        chat_entry = {"messages": messages}
                        w.write(json.dumps(chat_entry, ensure_ascii=False) + "\n")
                        count += 1
                
            except Exception as e:
                print(f"Error processing {json_file}: {e}")
                continue
    
    print(f"Normalized {count} conversations to {output_file}")
    return count

if __name__ == "__main__":
    normalize_persian_conversation_dataset()
