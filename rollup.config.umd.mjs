import { default as conf } from './rollup.config.mjs';

const config = {
    ...conf,
    output: {
        file: 'dist/localforage-getitems.js',
        format: 'umd',
        name: 'localforageGetItems'
    }
};

export default config;
