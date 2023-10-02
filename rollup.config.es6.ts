import { default as conf } from './rollup.config';

const config = {
    ...conf,
    format: 'es',
    dest: 'dist/localforage-getitems.es6.js',
};

export default config;
