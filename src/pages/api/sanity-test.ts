import type { APIRoute } from 'astro';
import { payloadFetch } from '../../lib/payload.client';

export const GET: APIRoute = async () => {
  try {
    const articles = await sanityFetch({
      query: `*[_type == "article"] { _id, title, slug }`
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sanity connection successful',
        articleCount: Array.isArray(articles) ? articles.length : 0,
        articles: articles,
        sampleArticle: Array.isArray(articles) && articles.length > 0 ? articles[0] : null
      }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null
      }, null, 2),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
