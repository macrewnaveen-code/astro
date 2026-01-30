import { buildConfig } from 'payload';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Articles } from './src/payload/collections/Articles';
import { Authors } from './src/payload/collections/Authors';
import { Comments } from './src/payload/collections/Comments';
import { Categories } from './src/payload/collections/Categories';
import { Tags } from './src/payload/collections/Tags';
import { Users } from './src/payload/collections/Users';
import { Media } from './src/payload/collections/Media';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use MongoDB for now (switching from PostgreSQL due to Neon connection issues)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lcdb';
console.log('Using MongoDB URI:', mongoUri.substring(0, 50) + '...');

export default buildConfig({
  admin: {
    user: 'users',
    css: path.resolve(__dirname, 'src/admin/custom.css'),
  },
  editor: lexicalEditor({}),
  collections: [
    Users,
    Articles,
    Authors,
    Comments,
    Categories,
    Tags,
    Media,
  ],
  db: mongooseAdapter({
    url: mongoUri,
  }),
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key-change-in-production',

  // Webhook configuration for ISR revalidation
  hooks: {
    afterChange: [
      async ({ doc, operation, collection }) => {
        // Only send webhooks for articles collection
        if (collection === 'articles' && (operation === 'create' || operation === 'update' || operation === 'delete')) {
          try {
            const webhookUrl = process.env.ASTRO_WEBHOOK_URL || 'http://localhost:4321/api/payload-webhook';
            const webhookSecret = process.env.PAYLOAD_WEBHOOK_SECRET;

            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(webhookSecret && { 'x-payload-webhook-secret': webhookSecret }),
              },
              body: JSON.stringify({
                type: operation,
                collection,
                doc,
                timestamp: new Date().toISOString(),
              }),
            });

            if (response.ok) {
              console.log(`✅ Webhook sent for ${collection} ${operation}: ${doc.slug || doc.id}`);
            } else {
              console.error(`❌ Webhook failed: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.error('❌ Webhook error:', error);
          }
        }
      },
    ],
  },

  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
});
