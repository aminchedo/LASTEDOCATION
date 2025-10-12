# What's Next: Phase 1 - Real LLM Inference Implementation

**Current Status**: Phase 7 Complete ✅  
**Next Phase**: Phase 1 - LLM Inference  
**Priority**: CRITICAL  
**Estimated Duration**: 1-2 weeks (with GPU), 3-4 weeks (CPU only)

---

## 🎯 Phase 1 Objective

Transform the LLM service from a framework with mock responses into a **real, working AI inference system** using HuggingFace transformers.

---

## 📋 Phase 1 Checklist

### Part 1: Environment Setup (Day 1)
- [ ] Run initial setup: `npm run setup`
- [ ] Configure `.env` file:
  - [ ] Set `JWT_SECRET` (generate: `openssl rand -base64 32`)
  - [ ] Set `LLM_MODEL=HooshvareLab/bert-fa-base-uncased`
  - [ ] Set `LLM_DEVICE=auto`
  - [ ] Optional: Set `HF_TOKEN` for faster downloads
- [ ] Run hardware detection: `npm run detect-hardware`
- [ ] Note your recommended configuration

### Part 2: Python Dependencies (Day 1)
- [ ] Install PyTorch: `pip install torch==2.1.2`
- [ ] Install Transformers: `pip install transformers==4.36.2`
- [ ] Install additional deps: `pip install datasets==2.16.1 accelerate==0.26.1`
- [ ] Verify installation: `python3 -c "import torch; print(torch.__version__)"`

### Part 3: Create Inference Server (Days 2-3)
- [ ] Create `BACKEND/scripts/inference_server.py` (see template below)
- [ ] Test model loading: `python3 BACKEND/scripts/inference_server.py small_cpu`
- [ ] Verify model loads successfully
- [ ] Test text generation with sample prompt

### Part 4: Backend Integration (Days 3-4)
- [ ] Update `BACKEND/src/services/persianLLMService.ts` to spawn Python process
- [ ] Remove mock response code
- [ ] Add error handling for model failures
- [ ] Test API endpoint: `curl -X POST http://localhost:3001/api/chat -d '{"message":"سلام"}'`

### Part 5: Frontend Integration (Day 5)
- [ ] Update frontend to handle real responses
- [ ] Remove mock data from chat interface
- [ ] Add loading states
- [ ] Add error states
- [ ] Test in browser

### Part 6: Testing & Validation (Days 6-7)
- [ ] Test with multiple prompts
- [ ] Verify responses are unique (not from dataset)
- [ ] Measure latency (should be 200-2000ms depending on hardware)
- [ ] Test error handling (model not loaded, timeout, etc.)
- [ ] Run health check: `npm run health-check` (LLM should be ✅)

---

## 📝 Implementation Templates

### Template 1: Python Inference Server

Create `BACKEND/scripts/inference_server.py`:

```python
#!/usr/bin/env python3
"""
Real LLM Inference Server
Compatible with: transformers==4.36.2, torch==2.1.2
"""

import sys
import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_CONFIGS = {
    "small_cpu": {
        "name": "HooshvareLab/bert-fa-base-uncased",
        "torch_dtype": torch.float32,
        "device_map": "cpu"
    },
    "medium_gpu": {
        "name": "persiannlp/gpt2-persian",
        "torch_dtype": torch.float16,
        "device_map": "auto"
    }
}

class InferenceServer:
    def __init__(self, config_key="small_cpu"):
        config = MODEL_CONFIGS[config_key]
        logger.info(f"Loading model: {config['name']}")
        
        self.tokenizer = AutoTokenizer.from_pretrained(config["name"])
        self.model = AutoModelForCausalLM.from_pretrained(
            config["name"],
            torch_dtype=config["torch_dtype"],
            device_map=config["device_map"]
        )
        self.device = next(self.model.parameters()).device
        logger.info(f"Model loaded on {self.device}")
    
    def generate(self, prompt, max_length=512, temperature=0.7):
        import time
        start = time.time()
        
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                temperature=temperature,
                do_sample=True
            )
        
        text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        latency = (time.time() - start) * 1000
        
        return {
            "text": text,
            "latency_ms": latency,
            "tokens": len(outputs[0]),
            "model": self.model.config.name_or_path
        }

def main():
    config_key = sys.argv[1] if len(sys.argv) > 1 else "small_cpu"
    server = InferenceServer(config_key)
    logger.info("Inference server ready")
    
    for line in sys.stdin:
        request = json.loads(line)
        result = server.generate(request["prompt"], request.get("max_length", 512))
        print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()
```

### Template 2: Updated TypeScript Service

Update `BACKEND/src/services/persianLLMService.ts`:

```typescript
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger';

export class PersianLLMService {
  private pythonProcess: ChildProcess | null = null;
  private isReady = false;

  async initialize(configKey: string = 'small_cpu'): Promise<void> {
    const scriptPath = path.join(__dirname, '../../scripts/inference_server.py');
    
    logger.info('Starting Python inference server...');
    
    this.pythonProcess = spawn('python3', [scriptPath, configKey]);
    
    // Wait for ready message
    return new Promise((resolve, reject) => {
      this.pythonProcess!.stderr?.on('data', (data) => {
        const message = data.toString();
        logger.info(`Inference server: ${message}`);
        
        if (message.includes('ready')) {
          this.isReady = true;
          resolve();
        }
      });
      
      this.pythonProcess!.on('error', (error) => {
        logger.error('Failed to start inference server', error);
        reject(error);
      });
      
      setTimeout(() => reject(new Error('Inference server timeout')), 30000);
    });
  }

  async generate(prompt: string, options: any = {}): Promise<any> {
    if (!this.isReady || !this.pythonProcess) {
      throw new Error('Inference server not ready');
    }

    const request = {
      prompt,
      max_length: options.maxTokens || 512,
      temperature: options.temperature || 0.7
    };

    return new Promise((resolve, reject) => {
      let response = '';
      
      const dataHandler = (data: Buffer) => {
        response += data.toString();
        try {
          const result = JSON.parse(response);
          this.pythonProcess!.stdout?.off('data', dataHandler);
          resolve(result);
        } catch {
          // Still accumulating data
        }
      };
      
      this.pythonProcess!.stdout?.on('data', dataHandler);
      
      this.pythonProcess!.stdin?.write(JSON.stringify(request) + '\n');
      
      setTimeout(() => reject(new Error('Generation timeout')), 30000);
    });
  }

  async shutdown(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.isReady = false;
    }
  }
}

export const llmService = new PersianLLMService();
```

---

## 🧪 Testing Plan

### Test 1: Model Loading
```bash
# Test Python inference server directly
python3 BACKEND/scripts/inference_server.py small_cpu

# Should see: "Model loaded on cpu" or "Model loaded on cuda:0"
# Exit with Ctrl+C
```

### Test 2: Single Generation
```bash
# Start backend
npm run dev:backend

# In another terminal, test API
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"سلام، چطوری؟"}'

# Should return JSON with Persian response (NOT from dataset)
```

### Test 3: Unique Responses
```bash
# Run same prompt twice
curl -X POST http://localhost:3001/api/chat \
  -d '{"message":"سلام"}' > response1.json

curl -X POST http://localhost:3001/api/chat \
  -d '{"message":"سلام"}' > response2.json

# Responses should be different (due to sampling)
diff response1.json response2.json
```

### Test 4: Health Check
```bash
npm run health-check

# LLM Service should show: ✅ Model loaded: HooshvareLab/bert-fa-base-uncased
```

### Test 5: Frontend Integration
```bash
# Start both backend and frontend
npm run dev

# Open http://localhost:5173
# Type message in chat
# Should see real LLM response (not mock data)
```

---

## 📊 Success Criteria

Phase 1 is complete when:

- [x] ✅ Python inference server loads real model
- [x] ✅ Model generates text (not from dataset)
- [x] ✅ Same prompt produces different responses
- [x] ✅ Latency is measured accurately
- [x] ✅ API returns real data (no mock responses)
- [x] ✅ Frontend displays real responses
- [x] ✅ Error handling works (model fails, timeout)
- [x] ✅ Health check passes for LLM service

---

## ⚠️ Common Issues & Solutions

### Issue: "torch not found"
**Solution**: Install PyTorch
```bash
pip install torch==2.1.2
```

### Issue: "CUDA out of memory"
**Solution**: Use CPU mode or smaller model
```bash
# In .env
LLM_DEVICE=cpu
```

### Issue: "Model download is slow"
**Solution**: Add HuggingFace token
```bash
# Get token from https://huggingface.co/settings/tokens
# Add to .env
HF_TOKEN=hf_xxxxxxxxxxxxx
```

### Issue: "Generation is very slow"
**Solution**: Normal on CPU. Expected times:
- CPU: 2-10 seconds per response
- GPU: 200-1000ms per response

### Issue: "Inference server crashes"
**Solution**: Check logs
```bash
# Check stderr
npm run dev:backend 2>&1 | grep -A 5 "inference"
```

---

## 📈 Expected Performance

### CPU (typical laptop)
- Model load time: 10-30 seconds
- Generation time: 2-10 seconds per response
- Acceptable for development/testing

### GPU (NVIDIA with 6GB+ VRAM)
- Model load time: 5-10 seconds
- Generation time: 200-1000ms per response
- Production-ready performance

### Optimization (Later)
- Quantization: 2-4x faster
- ONNX conversion: 2-3x faster
- Batch processing: 5-10x throughput

---

## 🎯 After Phase 1

Once Phase 1 is complete, proceed to:

### Phase 2: Real Training Pipeline (1-2 weeks)
- Implement actual PyTorch training loop
- Train on 4,504 sample dataset
- Save/load checkpoints
- Monitor loss decrease

### Phase 3: Voice Processing (1 week)
- Integrate Whisper for STT
- Integrate MMS-TTS for TTS
- Test with real audio

### Phase 4: HuggingFace Integration (1 week)
- Connect HuggingFace API
- Search/download datasets
- Remove mock data from UI

---

## 📞 Getting Help

### Resources
- HuggingFace Docs: https://huggingface.co/docs/transformers
- PyTorch Docs: https://pytorch.org/docs/
- Model Card: https://huggingface.co/HooshvareLab/bert-fa-base-uncased

### Documentation
- Phase 7 Status: `docs/PHASE7_IMPLEMENTATION_STATUS.md`
- Quick Reference: `QUICK_REFERENCE_PHASE7.md`
- API Types: `BACKEND/src/types/api.ts`

### Commands
```bash
npm run setup           # Setup environment
npm run health-check    # Check all services
npm run detect-hardware # Get recommendations
npm run dev             # Start development
```

---

## 📝 Notes

### Hardware Requirements
- **Minimum**: 8GB RAM, CPU
- **Recommended**: 16GB RAM + GPU with 6GB+ VRAM
- **Optimal**: 32GB RAM + GPU with 12GB+ VRAM

### Time Estimates
- Setup: 1-2 hours
- Implementation: 5-7 days
- Testing: 1-2 days
- **Total**: 1-2 weeks

### Model Choices
- **CPU**: `HooshvareLab/bert-fa-base-uncased` (162M params)
- **GPU (6-12GB)**: `persiannlp/gpt2-persian` (124M params)
- **GPU (12GB+)**: `SajjadAyoubi/persian-gpt2-large` (355M params)

---

## ✅ Ready to Start?

1. **First**: Run `npm run detect-hardware` to see your optimal config
2. **Then**: Follow the checklist above step by step
3. **Test**: Verify each step works before moving to next
4. **Document**: Note any issues for future reference

---

**Phase 1 Status**: ⏳ Ready to Start  
**Last Updated**: 2025-01-25  
**Estimated Completion**: 1-2 weeks from start

Good luck! 🚀
