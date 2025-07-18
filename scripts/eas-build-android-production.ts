#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const configPath = path.join(__dirname, '..', 'react-native', 'app.config.js');

// Read the current config file
const configContent = fs.readFileSync(configPath, 'utf8');

// Find and increment the versionCode
const versionCodeMatch = configContent.match(/versionCode:\s*(\d+)/);
if (!versionCodeMatch) {
  console.error('Could not find versionCode in app.config.js');
  process.exit(1);
}

const currentVersionCode = parseInt(versionCodeMatch[1]);
const newVersionCode = currentVersionCode + 1;

// Replace the versionCode in the content
const updatedContent = configContent.replace(
  /versionCode:\s*\d+/,
  `versionCode: ${newVersionCode}`
);

// Write the updated config back
fs.writeFileSync(configPath, updatedContent);

console.log(`✅ Updated Android versionCode from ${currentVersionCode} to ${newVersionCode}`);

// Run the EAS build command from the react-native directory
console.log('🚀 Starting EAS build...');
try {
  execSync('eas build --platform android --profile production', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', 'react-native')
  });
} catch (error) {
  console.error('Build failed:', error.message);
  
  // Revert the version code if build fails
  fs.writeFileSync(configPath, configContent);
  console.log(`⚠️  Reverted versionCode back to ${currentVersionCode} due to build failure`);
  
  process.exit(1);
}