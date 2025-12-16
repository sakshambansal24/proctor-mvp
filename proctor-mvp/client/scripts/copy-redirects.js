#!/usr/bin/env node

/**
 * Script to copy _redirects file to dist root for Netlify
 */

const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../src/assets/_redirects');
const destPath = path.join(__dirname, '../dist/proctor-mvp/_redirects');

// Create dist directory if it doesn't exist
const distDir = path.dirname(destPath);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy _redirects file
if (fs.existsSync(sourcePath)) {
  fs.copyFileSync(sourcePath, destPath);
  console.log('✅ Copied _redirects file to dist root');
} else {
  console.warn('⚠️  _redirects file not found in src/assets/');
}
