import next from 'eslint-config-next';
import nextTs from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', 'node_modules/**'] },
  ...next,
  ...nextTs,
];

export default config;
