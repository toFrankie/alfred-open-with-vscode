const { defineConfig } = require('rollup')
const resolve = require('@rollup/plugin-node-resolve')
const babel = require('@rollup/plugin-babel')
const pkg = require('./package.json')

module.exports = defineConfig({
  input: './src/index.js',
  output: {
    file: pkg.main,
    format: 'cjs',
    exports: 'named',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled',
      presets: [['@babel/preset-env', { targets: { node: '10' } }]],
    }),
  ],
})
