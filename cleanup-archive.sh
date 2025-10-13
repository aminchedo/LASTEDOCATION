#!/bin/bash
echo "🚀 Starting cleanup..."

mkdir -p archive/pages archive/components archive/hooks

# Archive duplicate pages
for file in TrainingPage TrainingJobsPage DataSourcesPage ModelsDatasetsPage ChatPage; do
  if [ -f "client/src/pages/${file}.tsx" ]; then
    echo "📦 Archiving ${file}.tsx"
    mv "client/src/pages/${file}.tsx" "archive/pages/${file}.tsx.archived"
  fi
done

echo "✅ Done! Files archived to: ./archive/"
ls -lh archive/pages/
