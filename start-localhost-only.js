#!/usr/bin/env node

// Optimized local development script specifically for localhost binding
// This script addresses network binding issues while maintaining full functionality

import { spawn } from 'child_process';

// Set environment variables for localhost-only development
process.env.NODE_ENV = 'development';
process.env.BIND_HOST = '127.0.0.1';  // Force localhost binding
process.env.LOCAL_DEV = 'true';

console.log('🏠 Starting CakesBuy in localhost-only mode...');
console.log('🔗 Server binding to 127.0.0.1 for maximum compatibility');
console.log('🔧 WebSocket functionality preserved');

// Start the development server
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  console.log('💡 Make sure tsx is installed: npm install tsx -g');
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n📋 Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Gracefully shutting down server...');
  server.kill('SIGTERM');
});