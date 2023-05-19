const {defineConfig} = require('rollup')
const resolve = require('@rollup/plugin-node-resolve')
const babel = require('@rollup/plugin-babel')

module.exports = defineConfig({
  input: './src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs',
    exports: 'named',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled',
      presets: [['@babel/preset-env', {targets: {node: '10'}}]],
    }),
  ],
})
