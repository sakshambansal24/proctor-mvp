const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Get recruiterId from command line argument or use default
const recruiterId = process.argv[2] || '507f1f77bcf86cd799439011';

// Validate ObjectId format (24 hex characters)
const mongoose = require('mongoose');
if (!mongoose.Types.ObjectId.isValid(recruiterId)) {
  console.error('❌ Error: Invalid recruiterId format');
  console.error(`   Provided: "${recruiterId}"`);
  console.error('   MongoDB ObjectIds must be exactly 24 hexadecimal characters (0-9, a-f)');
  console.error('\n💡 To generate a valid ObjectId, you can:');
  console.error('   1. Use an existing recruiter ID from your database');
  console.error('   2. Generate a new one: node -e "const mongoose = require(\'mongoose\'); console.log(new mongoose.Types.ObjectId().toString())"');
  console.error('\n   Example valid ObjectId: 507f1f77bcf86cd799439011');
  process.exit(1);
}

// Get JWT secret from environment
const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Check if secret is set
if (!secret || secret === 'your-secret-key-change-in-production') {
  console.error('❌ Error: JWT_SECRET not set in .env file');
  console.error('   Please set JWT_SECRET in server/.env file');
  console.error('   Example: JWT_SECRET=your-very-secure-secret-key-min-32-chars');
  process.exit(1);
}

// Generate token
const token = jwt.sign(
  { recruiterId },
  secret,
  { expiresIn: '7d' } // Token expires in 7 days
);

console.log('\n✅ JWT Token Generated Successfully!');
console.log('═'.repeat(60));
console.log('\n📋 Token:');
console.log(token);
console.log('\n📋 Full Authorization Header (copy this):');
console.log(`Authorization: Bearer ${token}`);
console.log('\n📋 For Postman/Insomnia:');
console.log('   Key: Authorization');
console.log(`   Value: Bearer ${token}`);
console.log('\n💡 Recruiter ID used:', recruiterId);
console.log('💡 Token expires in: 7 days');
console.log('\n' + '═'.repeat(60));
console.log('\n💡 Usage: node generate-token.js [recruiterId]');
console.log('   Example: node generate-token.js 507f1f77bcf86cd799439011');
console.log('   Note: recruiterId must be a valid MongoDB ObjectId (24 hex characters)\n');

