const createExpoWebpackConfigAsync = require('@expo/webpack-config');

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

  // Configuración específica para wa-sqlite
  config.module.rules.push({
    test: /\.wasm$/,
    type: "asset/resource"
  });

  return config;
};