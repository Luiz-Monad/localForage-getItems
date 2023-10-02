import { default as conf } from './rollup.config';

const config = {
    ...conf,
    format: 'umd',
    dest: 'dist/localforage-getitems.js',
    moduleName: 'localforageGetItems',
};

export default config;
