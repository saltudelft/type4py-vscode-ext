const path = require('path');
const { Stats } = require('webpack');
const webpack = require('webpack');

module.exports = /** @type WebpackConfig */ {
  //context: path.dirname(__dirname),
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
  target: 'webworker', // extensions run in a webworker context
  entry: {
    'extension': './src/extension.ts'
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
    extensions: ['.ts', '.js'], // support ts-files and js-files
    alias: {
      // provides alternate implementation for node module and source files
    },
    fallback: {
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
      'assert': require.resolve('assert'),
      'path': require.resolve('path-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'buffer': require.resolve("buffer"),
      'stream': require.resolve("stream-browserify"),
      'url': require.resolve('url-parse'),
      //'node-fetch': false
    }
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [{
          loader: 'ts-loader'
      }]
    }]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser', // provide a shim for the global `process` variable
    }),
  ],
  externals: {
    'vscode': 'commonjs vscode', // ignored because it doesn't exist
  },
  performance: {
    hints: false
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, './dist/web'),
    libraryTarget: 'commonjs',
    hashFunction: 'xxhash64'
  },
  devtool: 'nosources-source-map', // create a source map that points to the original source file,
  stats: {
    warningsFilter: "Module not found: Error: Can't resolve 'encoding'"
  }
};
