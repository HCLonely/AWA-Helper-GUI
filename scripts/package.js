(async () => {
  const zipdir = require('zip-dir');

  await zipdir('dist/win-unpacked', { saveTo: './AWA-Helper-GUI.zip' });
})();
