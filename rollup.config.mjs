import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';

export default {
    input: 'lib/localforage-getitems.ts',
    plugins: [babel({ babelHelpers: 'bundled' }), typescript()]
};
