#!/usr/bin/env ts-node

import path from 'path';
import { execSync } from 'child_process';

// Run the EAS submit command from the react-native directory
console.log('🚀 Starting EAS submission for iOS...');
try {
  execSync('eas submit --platform ios', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', 'react-native')
  });
  console.log('✅ iOS submission completed successfully');
} catch (error) {
  console.error('Submission failed:', error.message);
  process.exit(1);
}