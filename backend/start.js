require('dotenv/config');
require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    paths: { '@/*': ['./src/*'] },
    baseUrl: './src'
  }
});
require('./src/server.ts');
