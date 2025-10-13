# TTS Models Display & API Fix Guide

## 🔍 Issue Identified

The TTS (Text-to-Speech) models are not displaying properly or the API isn't working because:

1. **TTS Service is initialized but models aren't exposed via API**
   - TTS service has 4 voices configured internally
   - But there's no dedicated endpoint to list TTS models for the UI

2. **Model Detection doesn't scan for TTS model files**
   - The `/api/models/detected` endpoint scans for model files
   - But TTS models are internal voices, not file-based models

3. **Frontend expects TTS models in model list**
   - UI shows TTS models with special icon (Mic icon)
   - But TTS voices aren't included in the models API response

---

## ✅ Solution

### Backend Fixes

#### 1. **TTS Service Already Has Voices** ✅
The TTS service in `BACKEND/src/services/tts.ts` already has 4 Persian voices:
- `persian_female` - Female, Young, Tehran accent (High quality)
- `persian_male` - Male, Middle-aged, Tehran accent (High quality)
- `persian_female_isfahan` - Female, Young, Isfahan accent (Medium quality)
- `persian_male_shiraz` - Male, Old, Shiraz accent (Medium quality)

#### 2. **TTS API Already Has Voices Endpoint** ✅
`GET /api/tts/voices` - Returns list of available voices

**Example Response:**
```json
{
  "error": false,
  "data": {
    "voices": [
      {
        "name": "persian_female",
        "gender": "female",
        "age": "young",
        "accent": "tehran",
        "quality": "high"
      },
      {
        "name": "persian_male",
        "gender": "male",
        "age": "middle",
        "accent": "tehran",
        "quality": "high"
      }
    ],
    "count": 4
  }
}
```

#### 3. **Add TTS Models to `/api/models/detected`**

The `/api/models/detected` endpoint should include TTS voices as models:

```typescript
// In BACKEND/src/routes/models.ts
import { ttsService } from '../services/tts';

router.get('/detected', authenticateToken, async (req, res) => {
  try {
    // ... existing model detection code ...
    
    // Add TTS voices as models
    const ttsVoices = ttsService.getVoices();
    const ttsModels = ttsVoices.map(voice => ({
      id: `tts-${voice.name}`,
      name: voice.name,
      type: 'tts',
      modelFormat: 'voice',
      path: 'internal://tts/voices',
      size: 0,
      files: [],
      description: `${voice.gender} voice, ${voice.age}, ${voice.accent} accent`,
      language: ['fa', 'fa-IR'],
      lastModified: new Date().toISOString(),
      metadata: {
        gender: voice.gender,
        age: voice.age,
        accent: voice.accent,
        quality: voice.quality,
        isInternal: true
      },
      isTrainedModel: false
    }));
    
    // Combine with detected models
    const allModels = [...detectedModels, ...ttsModels];
    
    res.json({
      success: true,
      models: allModels,
      // ... rest of response
    });
  } catch (error) {
    // ... error handling
  }
});
```

---

## 🎯 Frontend Integration

### The Frontend is Already Set Up! ✅

The frontend components are already designed to display TTS models:

1. **`ModelHubPage.tsx`** - Shows TTS models with Mic icon
2. **`DetectedModelsPanel.tsx`** - Displays TTS models with special styling
3. **`useDetectedModels` hook** - Fetches models including type='tts'

**TTS Model Display:**
```tsx
const typeIcons = {
  model: Cpu,
  tts: Mic,      // ✅ Already has TTS icon
  dataset: Database,
};

const typeLabels = {
  model: 'مدل',
  tts: 'صدا (TTS)',  // ✅ Already has TTS label
  dataset: 'داده',
};
```

---

## 🚀 Quick Fix Implementation

### Step 1: Add TTS Models to Detection Endpoint

Update `BACKEND/src/routes/models.ts` to include TTS voices in the detected models list.

### Step 2: Test the API

```bash
# Get all detected models (should now include TTS)
curl http://localhost:3001/api/models/detected \
  -H "Authorization: Bearer <your_token>"

# Get TTS voices directly
curl http://localhost:3001/api/tts/voices

# Get TTS status
curl http://localhost:3001/api/tts/status
```

### Step 3: Verify in UI

1. Open http://localhost:3000
2. Go to **Model Hub** page
3. Should see TTS models with Mic icon
4. TTS models should show voice characteristics

---

## 📊 Expected Result

### Model Hub Should Show:

#### 🔵 AI Models (Cpu Icon)
- GPT models
- BERT models
- Custom trained models

#### 🟢 TTS Voices (Mic Icon)
- ✅ persian_female (High quality, Tehran)
- ✅ persian_male (High quality, Tehran)
- ✅ persian_female_isfahan (Medium quality, Isfahan)
- ✅ persian_male_shiraz (Medium quality, Shiraz)

#### 🟠 Datasets (Database Icon)
- Training datasets
- Evaluation datasets

---

## 🔧 Alternative: Dedicated TTS Endpoint

If you want a separate endpoint for TTS models:

```typescript
// BACKEND/src/routes/models.ts

router.get('/tts', authenticateToken, async (req, res) => {
  try {
    const ttsVoices = ttsService.getVoices();
    const ttsStatus = ttsService.getStatus();
    
    const ttsModels = ttsVoices.map(voice => ({
      id: `tts-${voice.name}`,
      name: voice.name,
      type: 'tts',
      voice: voice.name,
      gender: voice.gender,
      age: voice.age,
      accent: voice.accent,
      quality: voice.quality,
      languages: ttsService.getSupportedLanguages(),
      formats: ttsService.getSupportedFormats()
    }));
    
    return res.json({
      success: true,
      data: {
        models: ttsModels,
        count: ttsModels.length,
        status: ttsStatus,
        capabilities: {
          maxTextLength: 1000,
          supportedLanguages: ttsService.getSupportedLanguages(),
          supportedFormats: ttsService.getSupportedFormats()
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch TTS models',
      message: error.message
    });
  }
});
```

Then frontend can call: `GET /api/models/tts`

---

## 🧪 Testing TTS

### Test TTS Synthesis:

```bash
curl -X POST http://localhost:3001/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "سلام، این یک تست است",
    "voice": "persian_female",
    "speed": 1.0,
    "pitch": 1.0,
    "format": "wav"
  }'
```

### Test TTS Voices:

```bash
curl http://localhost:3001/api/tts/voices
```

### Test TTS Status:

```bash
curl http://localhost:3001/api/tts/status
```

---

## 📝 Summary

**The Issue:**
- TTS voices exist in the backend but aren't exposed as "models" in the detection API
- Frontend expects TTS models in the models list to display them

**The Fix:**
- Modify `/api/models/detected` to include TTS voices as models
- TTS voices should appear with `type: 'tts'`
- Frontend already has all the UI components to display them

**Status:**
- ✅ TTS Service: Working
- ✅ TTS API Endpoints: Working
- ✅ TTS Voices: 4 configured
- ✅ Frontend Components: Ready
- ❌ Integration: TTS voices not in models list (needs fix)

**Next Step:**
Update `BACKEND/src/routes/models.ts` to include TTS voices in the detected models response.

---

**Last Updated**: October 13, 2025
**Priority**: HIGH - User requested fix

