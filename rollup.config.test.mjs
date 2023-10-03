import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

const files = {
    'test.api': 'test/test.api.ts',
    runner: 'test/runner.ts'
};

export default {
    input: files,
    output: {
        dir: 'build/test',
        entryFileNames: '[name].js',
        format: 'amd',
        amd: {
            autoId: true
        },
        sourcemap: true
    },
    plugins: [
        typescript({ tsconfig: './test/tsconfig.json' }),
        babel({ babelHelpers: 'bundled' }),
        commonjs()
    ]
};
