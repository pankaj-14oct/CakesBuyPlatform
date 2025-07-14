#!/usr/bin/env node

// Simple local development server that handles WebSocket errors gracefully
// This script sets environment variables to avoid WebSocket issues in local dev

import { spawn } from 'child_process';
import path from 'path';

// Set environment variables for local development
process.env.NODE_ENV = 'development';
process.env.DISABLE_WEBSOCKET = 'true';

// Start the development server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.kill('SIGTERM');
});