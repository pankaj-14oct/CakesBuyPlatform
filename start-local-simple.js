#!/usr/bin/env node

// Simple script to start the app without WebSocket and with localhost binding
// This avoids both WebSocket and network binding issues in local environments

import { spawn } from 'child_process';

// Set environment variables for local development
process.env.NODE_ENV = 'development';
process.env.DISABLE_WEBSOCKET = 'true';
process.env.LOCAL_DEV = 'true';

console.log('🚀 Starting CakesBuy in local development mode...');
console.log('📡 WebSocket disabled for compatibility');
console.log('🌐 Server will bind to localhost instead of 0.0.0.0');

// Start the development server
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  console.log('💡 Try running: npm install tsx -g');
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});