#!/bin/bash
#
# Quick training script - Start a training job with one command
#
# Usage:
#   ./scripts/quick_train.sh                    # Use defaults
#   ./scripts/quick_train.sh 5 32 0.001        # Custom: 5 epochs, batch 32, lr 0.001
#   ./scripts/quick_train.sh 3 16 0.01 data.csv # With custom dataset
#

EPOCHS=${1:-3}
BATCH_SIZE=${2:-16}
LR=${3:-0.01}
DATASET=${4:-}

API_URL="http://127.0.0.1:3001"

echo "🚀 Starting training job..."
echo "   Epochs: $EPOCHS"
echo "   Batch Size: $BATCH_SIZE"
echo "   Learning Rate: $LR"
if [ -n "$DATASET" ]; then
    echo "   Dataset: $DATASET"
fi
echo ""

# Create request body
if [ -n "$DATASET" ]; then
    BODY="{\"epochs\":$EPOCHS,\"batch_size\":$BATCH_SIZE,\"lr\":$LR,\"dataset\":\"$DATASET\"}"
else
    BODY="{\"epochs\":$EPOCHS,\"batch_size\":$BATCH_SIZE,\"lr\":$LR}"
fi

# Submit job
RESPONSE=$(curl -s -X POST ${API_URL}/api/train \
    -H "Content-Type: application/json" \
    -d "$BODY")

JOB_ID=$(echo "$RESPONSE" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo "❌ Failed to create job"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Job created: $JOB_ID"
echo ""
echo "Monitor with:"
echo "  curl \"${API_URL}/api/train/status?job_id=${JOB_ID}\""
echo ""
echo "Or watch progress:"
echo "  watch -n 2 \"curl -s '${API_URL}/api/train/status?job_id=${JOB_ID}' | grep -E 'status|progress|epoch|loss'\""
