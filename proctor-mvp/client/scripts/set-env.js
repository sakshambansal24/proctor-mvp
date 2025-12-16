#!/usr/bin/env node

/**
 * Script to set environment variables for Angular build
 * This replaces the API URL in environment.prod.ts based on Netlify environment variables
 */

const fs = require('fs');
const path = require('path');

// Get API URL from environment variable (set in Netlify)
const apiUrl = process.env.NETLIFY_API_URL || process.env.API_URL || '/api';

// Path to environment.prod.ts
const envPath = path.join(__dirname, '../src/environments/environment.prod.ts');

// Read current environment file
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the apiUrl value
// Match: apiUrl: '...' or apiUrl: "..."
const apiUrlRegex = /apiUrl:\s*['"`][^'"`]*['"`]/;
const newApiUrl = `apiUrl: '${apiUrl}'`;

if (apiUrlRegex.test(envContent)) {
  envContent = envContent.replace(apiUrlRegex, newApiUrl);
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`✅ Updated API URL to: ${apiUrl}`);
} else {
  console.error('❌ Could not find apiUrl in environment.prod.ts');
  process.exit(1);
}
