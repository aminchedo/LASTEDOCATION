#!/bin/bash

# Generate Persian Audio Samples for Testing
# This script creates placeholder audio samples for voice E2E testing

set -e

AUDIO_DIR="audio/smoke"
mkdir -p "$AUDIO_DIR"

echo "Generating Persian audio samples..."

# Sample 1: سلام
cat > "$AUDIO_DIR/sample1-fa.txt" << EOF
Text: سلام، من یک دستیار هوشمند فارسی‌زبان هستم
Language: Persian (fa)
Duration: ~2 seconds
Purpose: Greeting and introduction
EOF

# Sample 2: سوال
cat > "$AUDIO_DIR/sample2-fa.txt" << EOF
Text: چطور می‌توانم به شما کمک کنم؟
Language: Persian (fa)
Duration: ~1.5 seconds
Purpose: Question/assistance offer
EOF

# Sample 3: پاسخ
cat > "$AUDIO_DIR/sample3-fa.txt" << EOF
Text: هوش مصنوعی یک شاخه از علوم کامپیوتر است
Language: Persian (fa)
Duration: ~2.5 seconds
Purpose: Informational response
EOF

# Create placeholder MP3 files (empty for now - to be replaced with real TTS)
touch "$AUDIO_DIR/sample1-fa.mp3"
touch "$AUDIO_DIR/sample2-fa.mp3"
touch "$AUDIO_DIR/sample3-fa.mp3"

# Create metadata
cat > "$AUDIO_DIR/metadata.json" << 'EOF'
{
  "generated_at": "2025-10-09T21:30:00Z",
  "samples": [
    {
      "id": "sample1-fa",
      "text": "سلام، من یک دستیار هوشمند فارسی‌زبان هستم",
      "language": "fa",
      "duration_seconds": 2.0,
      "format": "mp3",
      "sample_rate": 24000,
      "purpose": "greeting"
    },
    {
      "id": "sample2-fa",
      "text": "چطور می‌توانم به شما کمک کنم؟",
      "language": "fa",
      "duration_seconds": 1.5,
      "format": "mp3",
      "sample_rate": 24000,
      "purpose": "question"
    },
    {
      "id": "sample3-fa",
      "text": "هوش مصنوعی یک شاخه از علوم کامپیوتر است",
      "language": "fa",
      "duration_seconds": 2.5,
      "format": "mp3",
      "sample_rate": 24000,
      "purpose": "response"
    }
  ],
  "notes": "To generate real audio: Use Google Cloud TTS or Azure TTS with Persian voice (fa-IR-Standard-A)",
  "command": "gcloud text-to-speech synthesize --text=\"سلام\" --output=sample1-fa.mp3 --language-code=fa-IR --voice-name=fa-IR-Standard-A"
}
EOF

echo "✅ Audio samples generated in $AUDIO_DIR/"
echo "   - 3 text files with Persian content"
echo "   - 3 placeholder MP3 files"
echo "   - metadata.json with sample info"
echo ""
echo "To generate real audio with Google TTS:"
echo "  gcloud text-to-speech synthesize --text=\"سلام، من یک دستیار هوشمند فارسی‌زبان هستم\" \\"
echo "    --output=$AUDIO_DIR/sample1-fa.mp3 \\"
echo "    --language-code=fa-IR \\"
echo "    --voice-name=fa-IR-Standard-A"
echo ""
echo "Or use Azure TTS:"
echo "  az cognitiveservices speech synthesize \\"
echo "    --text \"سلام\" \\"
echo "    --voice fa-IR-DilaraNeural \\"
echo "    --output $AUDIO_DIR/sample1-fa.mp3"

