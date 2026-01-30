import type { APIRoute } from 'astro';
import { payloadFetch } from '../../lib/payload.client';
import { saveCommentToMongo, getArticleBySlugFromMongo } from '../../lib/mongo.server';

// Get comments for an article
export const GET: APIRoute = async ({ url }) => {
  try {
    const slug = url.searchParams.get('slug');
    const articleId = url.searchParams.get('articleId');

    console.log('📝 [COMMENTS API] Request received:', { slug, articleId });

    // Quick sanity check
    if (!slug && !articleId) {
      return new Response(JSON.stringify({ error: 'Missing slug or articleId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let article: any = null;

    if (articleId) {
      article = { id: articleId };
      console.log('📝 [COMMENTS API] Using articleId directly');
    } else if (slug) {
      console.log('📝 [COMMENTS API] Querying article by slug:', slug);
      try {
        const articles = await payloadFetch({
          collection: 'articles',
          query: { slug },
        });
        article = articles[0];
        console.log('📝 [COMMENTS API] Article found:', article?.id);
      } catch (queryErr) {
        console.error('📝 [COMMENTS API] Error querying article:', queryErr);
        throw queryErr;
      }
    }

    if (!article) {
      console.log('📝 [COMMENTS API] No article found');
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 [COMMENTS API] Fetching comments for:', article.id);
    const comments = await payloadFetch({
      collection: 'comments',
      query: { article: article.id },
    });

    console.log('📝 [COMMENTS API] Success! Found', comments?.length || 0, 'comments');
    return new Response(JSON.stringify(comments || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('📝 [COMMENTS API] FATAL ERROR:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: 'Server error',
      message: errorMsg
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST comment
export const POST: APIRoute = async ({ request, url }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { slug, author, email, text, rating } = await request.json();

    console.log('📝 [COMMENTS POST] Received:', { slug, author, email, rating });

    // Validation
    if (!slug || !author || !email || !text) {
      return new Response(JSON.stringify({ error: 'Missing required fields: slug, author, email, text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (text.length < 3 || text.length > 1000) {
      return new Response(JSON.stringify({ error: 'Comment must be between 3 and 1000 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch article ID from slug using MongoDB
    console.log('📝 [COMMENTS POST] Fetching article by slug from MongoDB:', slug);
    const article = await getArticleBySlugFromMongo(slug);

    if (!article) {
      console.error('📝 [COMMENTS POST] Article not found for slug:', slug);
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 [COMMENTS POST] Found article:', article._id);

    // Save comment to MongoDB
    console.log('📝 [COMMENTS POST] Saving comment to MongoDB...');
    const savedComment = await saveCommentToMongo(article._id, {
      author,
      email,
      text,
      rating,
    });

    console.log('📝 [COMMENTS POST] Comment saved successfully:', savedComment._id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Comment submitted successfully',
      commentId: savedComment._id,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('📝 [COMMENTS POST] Error saving comment:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save comment',
      details: errorMsg
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
