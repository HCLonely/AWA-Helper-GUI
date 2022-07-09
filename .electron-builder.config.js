const {version} = require('./package.json');
if (process.env.VITE_APP_VERSION === undefined) {
  process.env.VITE_APP_VERSION = version;
}

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  files: [
    'packages/**/dist/**',
  ],
  extraMetadata: {
    version: process.env.VITE_APP_VERSION,
  },
  extraFiles: 'resources/config.example.yml',
};

module.exports = config;
