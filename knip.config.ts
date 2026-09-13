import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // Files to exclude from Knip analysis
  ignore: [
    'checkly.config.ts',
    'unlighthouse.config.ts',
    'src/libs/I18n.ts',
    'src/libs/Logger.ts',
    'src/libs/Env.ts',
    'src/types/I18n.ts',
    'tests/**/*.ts',
    'src/libs/NvidiaGateway.ts',
  ],
  // Dependencies to ignore during analysis
  ignoreDependencies: [
    '@commitlint/types',
    '@clerk/testing',
    '@clerk/types',
    '@electric-sql/pglite-socket',
    '@faker-js/faker',
    '@spotlightjs/spotlight',
    '@types/pg',
    'checkly',
    'conventional-changelog-conventionalcommits',
    'dotenv',
    'dotenv-cli',
    'pino',
    'pino-pretty',
    'react-hook-form',
    '@hookform/resolvers',
    'vite',
  ],
  // Binaries to ignore during analysis
  ignoreBinaries: [
    'production', // False positive raised with dotenv-cli
  ],
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join('\n'),
  },
};

export default config;
