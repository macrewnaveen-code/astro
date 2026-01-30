// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const isDev = process.env.NODE_ENV === 'development';
const siteUrl = isDev
  ? 'http://localhost:4321'
  : 'https://sanity-pblxtvgo1-naveens-projects-f9bcb2c5.vercel.app';

export default defineConfig({
  site: siteUrl,

  // Change from 'server' to 'static' for 100% SSG/ISR
  output: 'static',

  adapter: vercel(),

  vite: {
    ssr: {
      external: ['svgo'],
    },
  },

  image: {
    domains: ['lacuisinedebernard.com', 'lcdb.fra1.digitaloceanspaces.com'],
  },
});
