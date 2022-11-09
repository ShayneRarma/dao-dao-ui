import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'

const config = {
  input: 'src/index.ts',
  output: {
    file: 'bundle.js',
    format: 'es',
  },
  plugins: [
    json(),
    typescript(),
  ],
}

export default config
