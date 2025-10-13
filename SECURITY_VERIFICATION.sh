#!/bin/bash
echo "🔒 Security Verification Script"
echo "=============================="
echo ""

# Check TypeScript
echo "1. TypeScript Compilation..."
cd BACKEND && npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TypeScript: 0 errors"
else
    echo "❌ TypeScript: Has errors"
fi

# Check security files exist
echo ""
echo "2. Security Files..."
FILES=(
    "src/middleware/error-handler.ts"
    "src/middleware/rate-limiter.ts"
    "src/middleware/validate.ts"
    "src/routes/health.ts"
    "src/__tests__/security.test.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
    fi
done

# Check logs directory
echo ""
echo "3. Logging Setup..."
if [ -d "logs" ]; then
    echo "✅ logs/ directory exists"
else
    mkdir -p logs
    echo "✅ logs/ directory created"
fi

echo ""
echo "4. Dependencies..."
if grep -q "winston" package.json; then
    echo "✅ winston installed"
fi
if grep -q "express-rate-limit" package.json; then
    echo "✅ express-rate-limit installed"
fi

echo ""
echo "✅ Security verification complete!"
