import babel from '@rollup/plugin-babel';
import multi from '@rollup/plugin-multi-entry';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'test/index_test.ts',
    output: {
        file: 'build/test-bundle.js',
        format: 'cjs'
    },
    plugins: [babel({ babelHelpers: 'bundled' }), multi(), typescript()]
};
