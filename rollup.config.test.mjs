import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

const files = {
    'test.api': 'test/test.api.ts',
    runner: 'test/runner.ts'
};

// export default Object.entries(files).map(([output, input]) => ({
//     input: input,
//     output: {
//         file: `build/test/${output}.js`,
//         name: output,
//         format: 'amd',
//         amd: {
//           autoId: true
//         },
//         sourcemap: true
//     },
//     plugins: [typescript({ tsconfig: './test/tsconfig.json' }), babel({ babelHelpers: 'bundled' })]
// }));

// export default {
//     input: ['test/test.api.ts', 'test/runner.ts'],
//     output: {
//         dir: 'build/',
//         format: 'cjs',
//         sourcemap: true,
//         preserveModules: true
//     },
//     plugins: [
//         typescript({tsconfig: './test/tsconfig.json'}), 
//         babel({ babelHelpers: 'bundled' })
// ]
// };

export default {
    input: files,
    output: {
        dir: 'build/test',
        entryFileNames: '[name].js',
        format: 'cjs',
        sourcemap: true
    },
    plugins: [typescript({ tsconfig: './test/tsconfig.json' }), babel({ babelHelpers: 'bundled' }), commonjs()]
};
