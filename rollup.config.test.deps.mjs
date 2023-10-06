import commonjs from '@rollup/plugin-commonjs';
import path from 'path';
import fs from 'fs';

const config = './build/config.js';
const deps = {
    config: config,
    chai: './node_modules/chai/chai.js',
    mocha: './node_modules/mocha/mocha.js',
    sinon: './node_modules/sinon/pkg/sinon.js',
    'sinon-chai': './node_modules/sinon-chai/lib/sinon-chai.js',
    localforage: './node_modules/@luiz-monad/localforage/dist/localforage.js',
    'localforage-getitems': './dist/localforage-getitems.js'
};

const mappedDeps = Object.entries(deps).reduce((acc, [key, value]) => {
    acc[key] = `${key}/${path.parse(value).name}`;
    return acc;
}, {});

const content = `export default ${JSON.stringify(mappedDeps)};`;
fs.writeFileSync(config, content);

export default Object.entries(deps).map(([output, input]) => ({
    input: input,
    output: {
        file: `build/deps/${output}/${output}.js`,
        name: output,
        format: 'amd',
        amd: {
            autoId: true
        },
        paths: {
            '@luiz-monad/localforage': 'localforage'
        }
        // preserveModules: true
    },
    plugins: [commonjs()],
    external: Object.keys(deps) + ['localforage']
}));
