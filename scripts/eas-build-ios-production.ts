#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const configPath = path.join(__dirname, '..', 'react-native', 'app.config.js');

// Read the current config file
const configContent = fs.readFileSync(configPath, 'utf8');

// Find and increment the iOS buildNumber
const buildNumberMatch = configContent.match(/buildNumber:\s*"(\d+)"/);
if (!buildNumberMatch) {
  console.error('Could not find iOS buildNumber in app.config.js');
  process.exit(1);
}

const currentBuildNumber = parseInt(buildNumberMatch[1]);
const newBuildNumber = currentBuildNumber + 1;

// Replace the buildNumber in the content
const updatedContent = configContent.replace(
  /buildNumber:\s*"\d+"/,
  `buildNumber: "${newBuildNumber}"`
);

// Write the updated config back
fs.writeFileSync(configPath, updatedContent);

console.log(`✅ Updated iOS buildNumber from ${currentBuildNumber} to ${newBuildNumber}`);

// Run the EAS build command from the react-native directory
console.log('🚀 Starting EAS build...');
try {
  execSync('eas build --platform ios --profile production', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', 'react-native')
  });
} catch (error) {
  console.error('Build failed:', error.message);
  
  // Revert the build number if build fails
  fs.writeFileSync(configPath, configContent);
  console.log(`⚠️  Reverted buildNumber back to ${currentBuildNumber} due to build failure`);
  
  process.exit(1);
}