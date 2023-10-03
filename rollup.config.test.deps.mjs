import commonjs from '@rollup/plugin-commonjs';

const deps = {
    chai: './node_modules/chai/chai.js',
    mocha: './node_modules/mocha/mocha.js',
    localforage: './node_modules/@luiz-monad/localforage/dist/localforage.js',
    'localforage-getitems': './dist/localforage-getitems.js'
};

export default Object.entries(deps).map(([output, input]) => ({
    input: input,
    output: {
        dir: `build/deps/${output}`,
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
