
const tsNode = require('ts-node');

tsNode.register({transpileOnly: true});

const RunTests = require('klesun-node-tools/src/Transpiled/RunTests.js');

console.log('Starting unit tests');
RunTests({rootPath: __dirname + '/../tests/'});
