// Load environment variables FIRST - this file must be imported before anything else
// Use require() to ensure synchronous loading before ES6 imports
const dotenv = require('dotenv');
const path = require('path');

// For dotenv v16+, we need to explicitly load the config
// Load .env file explicitly with explicit path resolution
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error && result.error.code !== 'ENOENT') {
  // Only warn if it's not a "file not found" error
  console.warn('⚠️  Error loading .env file:', result.error.message);
} else if (result.error && result.error.code === 'ENOENT') {
  // File doesn't exist - that's okay, use system environment variables
  // Don't warn for this case
}

// Export to ensure this module is executed
export default {};
