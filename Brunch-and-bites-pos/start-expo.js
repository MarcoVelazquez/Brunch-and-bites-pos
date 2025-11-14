#!/usr/bin/env node

// Cambiar al directorio correcto del proyecto antes de iniciar Expo
process.chdir(__dirname);

// Ejecutar Expo start
const { execSync } = require('child_process');

try {
  console.log('Iniciando Expo desde:', process.cwd());
  execSync('npx expo start --offline', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
} catch (error) {
  console.error('Error al iniciar Expo:', error.message);
  process.exit(1);
}