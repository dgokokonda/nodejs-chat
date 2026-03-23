// Для аполло клиента, вернее для сборки в lib нужных скриптов (apollo-client, graphql-tag), 
// но в приложении аполло клиент не подключен по причине того, что резолверы не срабатывали.
const esbuild = require('esbuild');
const path = require('path');

// Установка esbuild если нет
try {
  require.resolve('esbuild');
} catch (e) {
  console.log('Installing esbuild...');
  require('child_process').execSync('npm install --save-dev esbuild', { stdio: 'inherit' });
}

const fs = require('fs');
const publicLibPath = path.join(__dirname, 'public', 'lib');

// Создаём папку если нет
if (!fs.existsSync(publicLibPath)) {
  fs.mkdirSync(publicLibPath, { recursive: true });
}

// Сборка только core Apollo Client (без React)
console.log('Building Apollo Client core...');

esbuild.build({
  entryPoints: [path.join(__dirname, 'node_modules', '@apollo', 'client', 'core', 'index.js')],
  bundle: true,
  format: 'iife',
  globalName: 'ApolloClient',
  outfile: path.join(publicLibPath, 'apollo-client.js'),
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'window'
  },
  external: ['react'], // Исключаем React
}).then(() => {
  console.log('✓ Apollo Client core built');
}).catch((err) => {
  console.error('✗ Apollo Client build failed:', err);
});

// Сборка graphql-tag
const graphqlTagPaths = [
  path.join(__dirname, 'node_modules', 'graphql-tag', 'lib', 'index.js'),
  path.join(__dirname, 'node_modules', 'graphql-tag', 'src', 'index.js'),
  path.join(__dirname, 'node_modules', 'graphql-tag', 'index.js'),
];

let graphqlTagPath = null;
for (const p of graphqlTagPaths) {
  if (fs.existsSync(p)) {
    graphqlTagPath = p;
    break;
  }
}

if (graphqlTagPath) {
  console.log('Building graphql-tag...');
  esbuild.build({
    entryPoints: [graphqlTagPath],
    bundle: true,
    format: 'iife',
    globalName: 'graphqlTag',
    outfile: path.join(publicLibPath, 'graphql-tag.js'),
    platform: 'browser',
  }).then(() => {
    console.log('✓ graphql-tag built');
  }).catch((err) => {
    console.error('✗ graphql-tag build failed:', err);
  });
} else {
  console.error('✗ graphql-tag not found');
}

// Сборка graphql-ws
const graphqlWsPath = path.join(__dirname, 'node_modules', 'graphql-ws', 'lib', 'client.js');
if (fs.existsSync(graphqlWsPath)) {
  console.log('Building graphql-ws...');
  esbuild.build({
    entryPoints: [graphqlWsPath],
    bundle: true,
    format: 'iife',
    globalName: 'GraphQLWS',
    outfile: path.join(publicLibPath, 'graphql-ws.js'),
    platform: 'browser',
  }).then(() => {
    console.log('✓ graphql-ws built');
  }).catch((err) => {
    console.error('✗ graphql-ws build failed:', err);
  });
}

console.log('Build complete! Files in public/lib/');