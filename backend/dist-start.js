require('tsconfig-paths').register({
  baseUrl: './dist',
  paths: {
    '@/*': ['./*']
  }
});

require('./dist/server.js');
