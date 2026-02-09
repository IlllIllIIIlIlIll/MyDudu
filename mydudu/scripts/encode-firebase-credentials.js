#!/usr/bin/env node
/**
 * Encode Firebase service account JSON to Base64 for FIREBASE_SERVICE_ACCOUNT_BASE64.
 * Usage: node scripts/encode-firebase-credentials.js <path-to-service-account.json>
 * Example: node scripts/encode-firebase-credentials.js ./service-account.json
 */

const fs = require('fs');
const path = require('path');

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node encode-firebase-credentials.js <path-to-service-account.json>');
  process.exit(1);
}

const resolved = path.resolve(jsonPath);
if (!fs.existsSync(resolved)) {
  console.error('File not found:', resolved);
  process.exit(1);
}

const json = fs.readFileSync(resolved, 'utf8');
const base64 = Buffer.from(json, 'utf8').toString('base64');
console.log('\nFIREBASE_SERVICE_ACCOUNT_BASE64 (copy below):\n');
console.log(base64);
console.log('\n');
