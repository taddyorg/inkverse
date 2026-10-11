#!/usr/bin/env ts-node

import path from 'path';
import { execSync } from 'child_process';

const PLATFORMS = ['ios', 'android'] as const;
const PROFILES = ['production', 'internal'] as const;

type Platform = typeof PLATFORMS[number];
type Profile = typeof PROFILES[number];

const usage = 'Usage: tsx scripts/eas-submit.ts <ios|android> [production|internal]';

const platform = process.argv[2] as Platform;
const profile = (process.argv[3] ?? 'production') as Profile;

if (!PLATFORMS.includes(platform) || !PROFILES.includes(profile)) {
  console.error(usage);
  process.exit(1);
}

// Internal testing track only exists on Google Play
if (platform === 'ios' && profile === 'internal') {
  console.error('The internal profile is only available for android');
  console.error(usage);
  process.exit(1);
}

const label = `${platform === 'ios' ? 'iOS' : 'Android'} (${profile})`;

// Run the EAS submit command from the react-native directory
console.log(`🚀 Starting EAS submission for ${label}...`);
try {
  execSync(`eas submit --platform ${platform} --profile ${profile}`, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', 'react-native')
  });
  console.log(`✅ ${label} submission completed successfully`);
} catch (error) {
  console.error('Submission failed:', error.message);
  process.exit(1);
}
