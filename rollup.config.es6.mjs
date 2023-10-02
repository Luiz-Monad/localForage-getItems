import { default as conf } from './rollup.config.mjs';

const config = {
    ...conf,
    output: {
        file: 'dist/localforage-getitems.es6.js',
        format: 'es'
    }
};

export default config;
