import { payloadFetch } from '../../lib/payload.client';

export async function GET({ url }: { url: URL }) {
  const searchQuery = url.searchParams.get('q') || '';

  console.log(`🔎 API: Received search query: "${searchQuery}"`);

  if (!searchQuery || !searchQuery.trim()) {
    console.log(`ℹ️ API: Empty search query provided`);
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(`🔎 API: Fetching from Sanity with query for: "${searchQuery}"`);
    
    // Search articles using Sanity GROQ - match in title, excerpt, or content
    const results = await sanityFetch({
      query: `
        *[_type == "article" && (
          title match "${searchQuery}*" || 
          excerpt match "${searchQuery}*" || 
          content match "${searchQuery}*"
        )] | order(date desc) {
          _id,
          title,
          slug,
          excerpt,
          date,
          featuredImage,
          tags[]->{ _id, title, slug },
          categories[]->{ _id, title, slug }
        }
      `,
      tags: ['search']
    });

    console.log(`✅ API: Search returned ${results?.length || 0} results`);

    return new Response(JSON.stringify({ results: results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`❌ API: Search error:`, error);
    return new Response(
      JSON.stringify({
        error: 'Search failed',
        results: []
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
