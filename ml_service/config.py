import os
from pathlib import Path

class Settings:
    ML_SERVICE_PORT = int(os.getenv('ML_SERVICE_PORT', 8000))
    RANDOM_SEED = int(os.getenv('RANDOM_SEED', 2025))
    N_ESTIMATORS = int(os.getenv('N_ESTIMATORS', 100))
    TEST_SIZE = float(os.getenv('TEST_SIZE', 0.2))
    N_JOBS = int(os.getenv('N_JOBS', -1))
    MAX_UPLOAD_MB = int(os.getenv('MAX_UPLOAD_MB', 50))
    
    BASE_DIR = Path(__file__).parent
    MODELS_DIR = BASE_DIR / 'models'
    DB_PATH = BASE_DIR / 'jobs.db'
    LOGS_DIR = BASE_DIR / 'logs'

settings = Settings()

for d in [settings.MODELS_DIR, settings.LOGS_DIR]:
    d.mkdir(exist_ok=True)
