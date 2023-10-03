import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const deps = {
    chai: './node_modules/chai/chai.js',
    mocha: './node_modules/mocha/mocha.js',
    localforage: './node_modules/@luiz-monad/localforage/dist/localforage.js',
    'localforage-getitems': './dist/localforage-getitems.js'
};

// export default Object.entries(deps).map(([output, input]) => ({
//     input: input,
//     output: {
//         file: `build/deps/${output}/${output}.js`,
//         name: output,
//         format: 'amd',
//         amd: {
//           autoId: true
//         }
//     },
//     plugins: [resolve(), commonjs()]
// }));

export default {
    input: deps,
    output: {
        dir: 'build/deps',
        entryFileNames: '[name]/[name].js',
        format: 'cjs'
    },
    plugins: [resolve(), commonjs()]
};
