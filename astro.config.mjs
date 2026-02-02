// @ts-check
import { defineConfig } from 'astro/config';


const isDev = process.env.NODE_ENV === 'development';
const siteUrl = isDev
  ? 'http://localhost:4321'
  : 'https://your-scaleway-domain.com/';

export default defineConfig({
  site: siteUrl,


  // Use static output for Scaleway static hosting
  output: 'static',

  vite: {
    ssr: {
      external: ['svgo'],
    },
  },

  image: {
    domains: ['lacuisinedebernard.com', 'lcdb.fra1.digitaloceanspaces.com'],
  },
});
