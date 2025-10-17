# Models and Datasets Management System

## 📁 Directory Structure

```
BACKEND/
├── models/
│   ├── datasets/           # Dataset storage and management
│   │   ├── sample_persian_chat.jsonl
│   │   ├── persian_qa.jsonl
│   │   └── metadata.json   # Dataset metadata
│   ├── pretrained/         # Pre-trained models
│   │   ├── sample_model_config.json
│   │   └── metadata.json   # Model metadata
│   ├── checkpoints/        # Training checkpoints
│   ├── training/           # Training job outputs
│   └── downloads/          # Downloaded models
├── data/
│   ├── datasets/           # Raw dataset files
│   ├── models/             # Raw model files
│   ├── sources/            # Data sources configuration
│   │   └── huggingface_models.json
│   └── cache/              # Temporary files
└── src/
    ├── services/
    │   ├── datasetManager.ts    # Dataset management service
    │   ├── modelManager.ts      # Model management service
    │   └── offlineTraining.ts   # Offline training service
    └── routes/
        ├── datasets.ts          # Dataset API routes
        ├── models.ts            # Model API routes
        └── offlineTraining.ts   # Training API routes
```

## 🚀 Features

### Dataset Management
- **Upload & Storage**: Upload datasets in JSON, JSONL, CSV, TXT formats
- **Metadata Management**: Track dataset information, versioning, and statistics
- **Validation**: Validate dataset integrity and format
- **Search & Filter**: Search by name, description, tags, language
- **Versioning**: Create and manage dataset versions
- **Export**: Export datasets to different locations

### Model Management
- **Upload & Storage**: Upload models in various frameworks (PyTorch, TensorFlow, ONNX, etc.)
- **Metadata Management**: Track model information, metrics, and requirements
- **Download Management**: Download models from external sources with progress tracking
- **Validation**: Validate model integrity and compatibility
- **Versioning**: Create and manage model versions
- **Export**: Export models to different locations

### Offline Training
- **Training Jobs**: Create, manage, and monitor training jobs
- **Dataset Integration**: Use managed datasets for training
- **Model Integration**: Use managed models as base models
- **Progress Tracking**: Real-time training progress and metrics
- **Logging**: Comprehensive training logs
- **Checkpointing**: Automatic model checkpointing

## 📊 API Endpoints

### Dataset Management
```
GET    /api/datasets                    # List all datasets
GET    /api/datasets/:id                # Get dataset by ID
POST   /api/datasets                    # Upload new dataset
PUT    /api/datasets/:id                # Update dataset metadata
DELETE /api/datasets/:id                # Delete dataset
POST   /api/datasets/:id/versions       # Create dataset version
POST   /api/datasets/:id/validate       # Validate dataset
POST   /api/datasets/:id/export         # Export dataset
GET    /api/datasets/stats/overview     # Get dataset statistics
GET    /api/datasets/health             # Health check
```

### Model Management
```
GET    /api/models                      # List all models
GET    /api/models/:id                  # Get model by ID
POST   /api/models                      # Upload new model
PUT    /api/models/:id                  # Update model metadata
DELETE /api/models/:id                  # Delete model
POST   /api/models/download             # Start model download
GET    /api/models/downloads            # List all downloads
GET    /api/models/downloads/:id        # Get download status
DELETE /api/models/downloads/:id        # Cancel download
POST   /api/models/:id/versions        # Create model version
POST   /api/models/:id/validate        # Validate model
POST   /api/models/:id/export          # Export model
GET    /api/models/stats/overview      # Get model statistics
GET    /api/models/health              # Health check
```

### Offline Training
```
GET    /api/offline-training            # List all training jobs
GET    /api/offline-training/:id        # Get training job by ID
POST   /api/offline-training            # Create new training job
POST   /api/offline-training/:id/start  # Start training
POST   /api/offline-training/:id/pause  # Pause training
POST   /api/offline-training/:id/resume # Resume training
POST   /api/offline-training/:id/cancel # Cancel training
DELETE /api/offline-training/:id        # Delete training job
GET    /api/offline-training/:id/logs   # Get training logs
GET    /api/offline-training/:id/metrics # Get training metrics
GET    /api/offline-training/stats/overview # Get training statistics
GET    /api/offline-training/health    # Health check
```

## 🔧 Usage Examples

### Upload a Dataset
```bash
curl -X POST http://localhost:3001/api/datasets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@dataset.jsonl" \
  -F "name=Persian Chat Dataset" \
  -F "description=Persian conversational dataset" \
  -F "version=1.0.0" \
  -F "format=jsonl" \
  -F "language=fa" \
  -F "source=manual" \
  -F "tags=chat,persian,conversation"
```

### Upload a Model
```bash
curl -X POST http://localhost:3001/api/models \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@model.bin" \
  -F "name=Persian BERT" \
  -F "description=Persian BERT model" \
  -F "version=1.0.0" \
  -F "type=llm" \
  -F "framework=pytorch" \
  -F "language=fa" \
  -F "source=huggingface" \
  -F "tags=bert,persian,embedding"
```

### Create Training Job
```bash
curl -X POST http://localhost:3001/api/offline-training \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Persian Model Training",
    "datasetId": "dataset_123",
    "baseModelId": "model_456",
    "config": {
      "modelType": "llm",
      "architecture": "transformer",
      "hiddenSize": 768,
      "numLayers": 12,
      "numHeads": 12,
      "vocabSize": 50000,
      "epochs": 10,
      "batchSize": 32,
      "learningRate": 0.0001,
      "weightDecay": 0.01,
      "warmupSteps": 1000,
      "gradientAccumulationSteps": 1,
      "maxGradNorm": 1.0,
      "trainSplit": 0.8,
      "valSplit": 0.1,
      "testSplit": 0.1,
      "maxSequenceLength": 512,
      "dataAugmentation": true,
      "optimizer": "adamw",
      "scheduler": "linear",
      "mixedPrecision": true,
      "gradientCheckpointing": false,
      "useGPU": true,
      "numGPUs": 1,
      "cpuOnly": false,
      "saveSteps": 1000,
      "evalSteps": 500,
      "loggingSteps": 100,
      "saveTotalLimit": 3
    }
  }'
```

### Start Training
```bash
curl -X POST http://localhost:3001/api/offline-training/job_123/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📈 Monitoring and Statistics

### Dataset Statistics
```bash
curl -X GET http://localhost:3001/api/datasets/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalDatasets": 5,
    "totalSize": 1048576,
    "languages": ["fa", "en"],
    "formats": ["jsonl", "json", "csv"],
    "tags": ["chat", "qa", "persian"]
  }
}
```

### Model Statistics
```bash
curl -X GET http://localhost:3001/api/models/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalModels": 3,
    "totalSize": 52428800,
    "types": ["llm", "stt", "tts"],
    "frameworks": ["pytorch", "huggingface"],
    "languages": ["fa"],
    "tags": ["bert", "gpt", "persian"],
    "activeDownloads": 1
  }
}
```

### Training Statistics
```bash
curl -X GET http://localhost:3001/api/offline-training/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalJobs": 10,
    "runningJobs": 2,
    "completedJobs": 6,
    "failedJobs": 2,
    "totalTrainingTime": 3600000
  }
}
```

## 🔒 Security Features

- **Authentication**: All endpoints require JWT authentication
- **File Validation**: Strict file type and size validation
- **Checksum Verification**: Automatic file integrity checking
- **Access Control**: Role-based access control (future enhancement)

## 🚀 Getting Started

1. **Start the Backend Server**:
   ```bash
   cd BACKEND
   npm run dev
   ```

2. **Authenticate**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}'
   ```

3. **Upload Your First Dataset**:
   ```bash
   curl -X POST http://localhost:3001/api/datasets \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@your_dataset.jsonl" \
     -F "name=My Dataset" \
     -F "description=My first dataset" \
     -F "version=1.0.0" \
     -F "format=jsonl" \
     -F "language=fa" \
     -F "source=manual" \
     -F "tags=test"
   ```

4. **Create Your First Training Job**:
   ```bash
   curl -X POST http://localhost:3001/api/offline-training \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Training Job",
       "datasetId": "dataset_id_from_step_3",
       "config": {
         "modelType": "llm",
         "architecture": "transformer",
         "hiddenSize": 512,
         "numLayers": 6,
         "numHeads": 8,
         "vocabSize": 30000,
         "epochs": 5,
         "batchSize": 16,
         "learningRate": 0.0001,
         "weightDecay": 0.01,
         "warmupSteps": 500,
         "gradientAccumulationSteps": 1,
         "maxGradNorm": 1.0,
         "trainSplit": 0.8,
         "valSplit": 0.1,
         "testSplit": 0.1,
         "maxSequenceLength": 256,
         "dataAugmentation": false,
         "optimizer": "adamw",
         "scheduler": "linear",
         "mixedPrecision": false,
         "gradientCheckpointing": false,
         "useGPU": false,
         "numGPUs": 0,
         "cpuOnly": true,
         "saveSteps": 500,
         "evalSteps": 250,
         "loggingSteps": 50,
         "saveTotalLimit": 2
       }
     }'
   ```

## 📝 Notes

- **File Size Limits**: Datasets limited to 100MB, models limited to 500MB
- **Supported Formats**: JSON, JSONL, CSV, TXT for datasets; various binary formats for models
- **Persian Language Support**: Full support for Persian/Farsi text processing
- **Offline Training**: Requires Python environment with PyTorch/TensorFlow
- **Storage**: All files stored locally in the `models/` and `data/` directories
- **Backup**: Regular backups recommended for important datasets and models

## 🐛 Troubleshooting

### Common Issues

1. **File Upload Fails**:
   - Check file size limits
   - Verify file format is supported
   - Ensure authentication token is valid

2. **Training Job Fails**:
   - Check dataset and model IDs are valid
   - Verify Python environment is set up
   - Check training logs for specific errors

3. **Download Fails**:
   - Verify download URL is accessible
   - Check network connectivity
   - Ensure sufficient disk space

### Support

For issues and questions:
- Check the logs in `logs/` directory
- Review error messages in API responses
- Test individual endpoints with curl or Postman

## 🎯 Status

✅ **Fully Functional** - All features working
- Dataset Management: ✅
- Model Management: ✅
- Offline Training: ✅
- API Endpoints: ✅
- File Upload/Download: ✅
- Progress Tracking: ✅
- Statistics & Monitoring: ✅

The models and datasets management system is ready for production use!
