#!/usr/bin/env node

// Local development script that bypasses all network binding issues
// Forces localhost-only mode and disables problematic features

import { spawn } from 'child_process';

// Set comprehensive environment variables for local development
process.env.NODE_ENV = 'development';
process.env.DISABLE_WEBSOCKET = 'true';
process.env.LOCAL_DEV = 'true';
process.env.HOST = 'localhost';
process.env.BIND_HOST = 'localhost';

console.log('🏠 Starting CakesBuy in localhost-only mode...');
console.log('🚫 WebSocket disabled');
console.log('🔒 Network binding limited to localhost');

// Start with tsx directly to avoid npm overhead
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  console.log('💡 Make sure you have tsx installed: npm install -g tsx');
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Server exited with code ${code}`);
  } else {
    console.log('✅ Server stopped gracefully');
  }
  process.exit(code);
});

// Handle process termination gracefully
const cleanup = () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
  setTimeout(() => {
    server.kill('SIGKILL');
  }, 5000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGQUIT', cleanup);