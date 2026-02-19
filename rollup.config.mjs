import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';

export default [
  // Primary bundle (Node + Frontend)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs', format: 'cjs' },  // Node.js CommonJS
      { file: 'dist/index.esm.js', format: 'esm' } // Frontend ES Modules
    ],
    plugins: [
      peerDepsExternal(),
      resolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json'
    })
    ]
  },

  // Type definitions
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()]
  }
];
