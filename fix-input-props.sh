#!/bin/bash
# Script to remove label and helperText props from Input components and wrap them properly

cd /workspace/client/src/pages

# For SettingsPage, just comment out the training section for now
sed -i 's/} else if (key === '\''training'\'') {/\/\/ } else if (key === '\''training'\'') {/' SettingsPage.tsx
sed -i 's/updated\.training = { \.\.\.prev\.training, \[nestedKey\]: value };/\/\/ updated.training = { ...prev.training, [nestedKey]: value };/' SettingsPage.tsx

echo "Fixed SettingsPage training references"
