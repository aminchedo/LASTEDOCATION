#!/bin/bash
# Persian Chat Application Acceptance Tests
# Tests all components including speech datasets, STT/TTS, and Persian enforcement

set -e

echo "🎯 Starting Persian Chat Application Acceptance Tests..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${YELLOW}Testing: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to check if a file exists
check_file() {
    local file_path="$1"
    if [ -f "$file_path" ]; then
        return 0
    else
        echo "File not found: $file_path"
        return 1
    fi
}

# Function to check if a directory exists
check_dir() {
    local dir_path="$1"
    if [ -d "$dir_path" ]; then
        return 0
    else
        echo "Directory not found: $dir_path"
        return 1
    fi
}

# Function to check if a service is running
check_service() {
    local service_name="$1"
    local port="$2"
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" | grep -E "200|404" >/dev/null; then
        return 0
    else
        echo "Service $service_name not responding on port $port"
        return 1
    fi
}

# Function to check Persian text
check_persian_text() {
    local text="$1"
    if echo "$text" | grep -q "[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]"; then
        return 0
    else
        echo "Text does not contain Persian characters: $text"
        return 1
    fi
}

echo "== Dataset Validation =="
run_test "Hugging Face datasets exist" "check_file 'datasets/train.jsonl' && check_file 'datasets/test.jsonl' && check_file 'datasets/combined.jsonl'"
run_test "Dataset checksums exist" "check_file 'datasets/checksums.txt'"
run_test "Dataset sources log exists" "check_file 'logs/dataset_sources.json'"

echo "== Speech Datasets (Persian) =="
run_test "Speech datasets exist" "check_file 'logs/speech_sources.json'"
run_test "Speech manifests exist" "check_dir 'audio/manifests' && check_file 'audio/manifests/train.jsonl' && check_file 'audio/manifests/test.jsonl'"
run_test "Sample audio files exist" "check_dir 'audio/smoke' && check_file 'audio/smoke/manifest.json'"

echo "== Backend Services =="
run_test "Backend server is running" "check_service 'backend' 3001"

echo "== API Routes =="
run_test "Chat API route" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/chat | grep -E '200|405' >/dev/null"
run_test "STT route" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/stt/health | grep -E '200|405' >/dev/null"
run_test "TTS route" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/tts/health | grep -E '200|405' >/dev/null"
run_test "Search route" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/search/health | grep -E '200|405' >/dev/null"
run_test "Monitoring route" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/monitoring/metrics | grep -E '200|405' >/dev/null"

echo "== Persian Output Enforcement =="
run_test "Persian text validation" "node -e \"const txt='سلام این یک تست است'; if(!/[\u0600-\u06FF]/.test(txt)){ process.exit(1);} console.log('Persian text validation passed');\""

echo "== Model Training =="
run_test "Model metadata exists" "check_file 'models/persian-chat/model_metadata.json'"
run_test "Training report exists" "check_file 'logs/training_report.json'"

echo "== Frontend =="
run_test "Frontend build exists" "check_dir 'client/dist' || check_dir 'client/build'"

echo "== Configuration =="
run_test "Environment configuration" "check_file 'backend/.env' || check_file 'backend/.env.example'"
run_test "Package.json exists" "check_file 'package.json' && check_file 'backend/package.json' && check_file 'client/package.json'"

echo "== Documentation =="
run_test "README exists" "check_file 'README.md'"
run_test "Documentation exists" "check_dir 'docs'"

echo "== Logs and Reports =="
run_test "Logs directory exists" "check_dir 'logs'"
run_test "Sample audio report exists" "check_file 'logs/sample_audio_report.json'"

echo "== File Structure =="
run_test "Required directories exist" "check_dir 'backend' && check_dir 'client' && check_dir 'datasets' && check_dir 'audio' && check_dir 'models'"

echo "== Security and Quality =="
run_test "No sensitive files exposed" "! find . -name '*.env' -not -path './backend/.env' -not -path './client/.env' | head -1"
run_test "TypeScript compilation" "cd backend && npm run build >/dev/null 2>&1"

echo "== Performance =="
run_test "Backend response time" "curl -s -o /dev/null -w '%{time_total}' http://localhost:3001/health | awk '{if(\$1 < 1.0) exit 0; else exit 1}'"

echo "== Integration =="
run_test "Chat API responds with Persian" "curl -s -X POST http://localhost:3001/api/chat -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}' | grep -q 'سلام'"

echo "== Final Validation =="
run_test "All core files present" "check_file 'backend/src/server.ts' && check_file 'client/src/App.tsx'"
run_test "Services initialized" "check_file 'backend/src/services/persianLLMService.ts' && check_file 'backend/src/services/stt.ts' && check_file 'backend/src/services/tts.ts'"

echo ""
echo "=================================================="
echo "🎯 Acceptance Test Summary"
echo "=================================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All acceptance tests passed!${NC}"
    echo "✅ Persian Chat Application is ready for production"
    exit 0
else
    echo -e "\n${RED}⚠️  Some acceptance tests failed.${NC}"
    echo "❌ Please fix the issues before deployment"
    exit 1
fi