const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@azure/core-http']
    },
  }, argv);

  // Configuración para archivos .wasm
  config.resolve.extensions.push('.wasm');
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "path": require.resolve("path-browserify"),
    "fs": false
  };

  // Configuración específica para wa-sqlite WASM files
  config.module.rules.push({
    test: /\.wasm$/,
    type: "asset/resource",
    generator: {
      filename: 'static/wasm/[name].[contenthash][ext]'
    }
  });

  // Configuración específica para expo-sqlite web worker
  config.module.rules.push({
    test: /worker\.ts$/,
    use: {
      loader: 'worker-loader',
      options: {
        filename: 'static/workers/[name].[contenthash].js'
      }
    }
  });

  // Resolver alias para wa-sqlite
  config.resolve.alias = {
    ...config.resolve.alias,
    '@sqlite.org/sqlite-wasm': path.resolve(__dirname, 'node_modules/@sqlite.org/sqlite-wasm')
  };

  // Configuración para manejo de workers
  config.output.globalObject = 'self';

  return config;
};