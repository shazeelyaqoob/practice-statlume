import next from 'eslint-config-next';
import nextTs from 'eslint-config-next/typescript';

export default [
  { ignores: ['.next/**', 'node_modules/**'] },
  ...next,
  ...nextTs,
];
