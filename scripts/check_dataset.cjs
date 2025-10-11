#!/usr/bin/env node
/**
 * Dataset Validation Script for Persian Chat Application
 * Validates the structure and format of generated datasets
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function validateConversationFormat(conversation) {
  // Check if conversation has required structure
  if (!conversation.messages || !Array.isArray(conversation.messages)) {
    return { valid: false, error: 'Missing or invalid messages array' };
  }

  if (conversation.messages.length === 0) {
    return { valid: false, error: 'Empty messages array' };
  }

  // Check each message
  for (let i = 0; i < conversation.messages.length; i++) {
    const message = conversation.messages[i];
    
    if (!message.role || !message.content) {
      return { valid: false, error: `Message ${i} missing role or content` };
    }

    if (!['system', 'user', 'assistant'].includes(message.role)) {
      return { valid: false, error: `Message ${i} has invalid role: ${message.role}` };
    }

    if (typeof message.content !== 'string' || message.content.trim().length === 0) {
      return { valid: false, error: `Message ${i} has invalid content` };
    }
  }

  // Check for system message
  const hasSystemMessage = conversation.messages.some(msg => msg.role === 'system');
  if (!hasSystemMessage) {
    return { valid: false, error: 'Missing system message' };
  }

  // Check for user message
  const hasUserMessage = conversation.messages.some(msg => msg.role === 'user');
  if (!hasUserMessage) {
    return { valid: false, error: 'Missing user message' };
  }

  // Check for assistant message
  const hasAssistantMessage = conversation.messages.some(msg => msg.role === 'assistant');
  if (!hasAssistantMessage) {
    return { valid: false, error: 'Missing assistant message' };
  }

  return { valid: true };
}

function validateDataset(filePath) {
  console.log(`🔍 Validating ${path.basename(filePath)}...`);
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'File does not exist' };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  if (lines.length === 0) {
    return { valid: false, error: 'Empty file' };
  }

  const stats = {
    totalConversations: lines.length,
    validConversations: 0,
    invalidConversations: 0,
    errors: []
  };

  // Validate each conversation
  lines.forEach((line, index) => {
    try {
      const conversation = JSON.parse(line);
      const validation = validateConversationFormat(conversation);
      
      if (validation.valid) {
        stats.validConversations++;
      } else {
        stats.invalidConversations++;
        stats.errors.push(`Line ${index + 1}: ${validation.error}`);
      }
    } catch (error) {
      stats.invalidConversations++;
      stats.errors.push(`Line ${index + 1}: JSON parse error - ${error.message}`);
    }
  });

  // Check checksum if available
  const checksumPath = filePath + '.sha256';
  if (fs.existsSync(checksumPath)) {
    const expectedHash = fs.readFileSync(checksumPath, 'utf-8').trim();
    const actualHash = generateHash(content);
    
    if (expectedHash === actualHash) {
      console.log(`✅ Checksum verified for ${path.basename(filePath)}`);
    } else {
      stats.errors.push(`Checksum mismatch for ${path.basename(filePath)}`);
    }
  }

  return {
    valid: stats.invalidConversations === 0,
    stats,
    filePath
  };
}

function validateAllDatasets() {
  console.log('🎯 Starting dataset validation...');
  
  const datasetsDir = path.join(process.cwd(), 'datasets');
  const logsDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(datasetsDir)) {
    console.error('❌ Datasets directory not found');
    return false;
  }

  const results = [];
  
  // Validate each dataset file
  const datasetFiles = ['train.jsonl', 'test.jsonl', 'combined.jsonl'];
  
  datasetFiles.forEach(filename => {
    const filePath = path.join(datasetsDir, filename);
    const result = validateDataset(filePath);
    results.push(result);
    
    if (result.valid) {
      console.log(`✅ ${filename}: ${result.stats.validConversations} valid conversations`);
    } else {
      console.log(`❌ ${filename}: ${result.stats.invalidConversations} invalid conversations`);
      result.stats.errors.forEach(error => console.log(`   - ${error}`));
    }
  });

  // Check dataset sources log
  const sourcesPath = path.join(logsDir, 'dataset_sources.json');
  if (fs.existsSync(sourcesPath)) {
    try {
      const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
      console.log(`✅ Dataset sources log: ${sources.total_conversations} total conversations`);
      console.log(`📊 Train: ${sources.train_conversations}, Test: ${sources.test_conversations}`);
      
      sources.datasets.forEach(dataset => {
        console.log(`   - ${dataset.name}: ${dataset.count} conversations`);
      });
    } catch (error) {
      console.log(`❌ Dataset sources log: Invalid JSON - ${error.message}`);
    }
  } else {
    console.log('⚠️  Dataset sources log not found');
  }

  // Summary
  const allValid = results.every(result => result.valid);
  const totalValid = results.reduce((sum, result) => sum + result.stats.validConversations, 0);
  const totalInvalid = results.reduce((sum, result) => sum + result.stats.invalidConversations, 0);

  console.log('\n📋 Validation Summary:');
  console.log(`✅ Valid conversations: ${totalValid}`);
  console.log(`❌ Invalid conversations: ${totalInvalid}`);
  console.log(`📁 Files validated: ${results.length}`);
  
  if (allValid) {
    console.log('\n🎉 All datasets are valid and ready for training!');
    return true;
  } else {
    console.log('\n⚠️  Some datasets have validation errors');
    return false;
  }
}

function main() {
  try {
    const success = validateAllDatasets();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateDataset, validateAllDatasets };
