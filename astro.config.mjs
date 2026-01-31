// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const isDev = process.env.NODE_ENV === 'development';
const siteUrl = isDev
  ? 'http://localhost:4321'
  : 'https://astro-one-gilt.vercel.app/';

export default defineConfig({
  site: siteUrl,

  // Change to 'server' for ISR - generate pages on-demand
  output: 'server',

  adapter: vercel({
    // Enable ISR with 1 hour revalidation
    isr: {
      expiration: 60 * 60, // 1 hour in seconds
    },
  }),

  vite: {
    ssr: {
      external: ['svgo'],
    },
  },

  image: {
    domains: ['lacuisinedebernard.com', 'lcdb.fra1.digitaloceanspaces.com'],
  },
});
