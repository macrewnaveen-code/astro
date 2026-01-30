import { initPayload } from './lib/payload-init';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const payload = await initPayload();
    // Handle Payload API routes
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/payload', '');

    // This is a simplified example - you'd need to proxy all Payload routes
    return new Response(JSON.stringify({ message: 'Payload API route' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};