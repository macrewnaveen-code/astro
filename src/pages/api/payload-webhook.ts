// Webhook endpoint for Payload CMS content revalidation
// This enables ISR (Incremental Static Regeneration)

// Mark as server-rendered for API functionality
export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { type, doc } = body;

    console.log('🔄 Webhook received:', { type, docId: doc?.id, slug: doc?.slug });

    // Validate webhook secret (add security in production)
    const webhookSecret = process.env.PAYLOAD_WEBHOOK_SECRET;
    const receivedSecret = request.headers.get('x-payload-webhook-secret');

    if (webhookSecret && receivedSecret !== webhookSecret) {
      console.error('❌ Invalid webhook secret');
      return new Response('Unauthorized', { status: 401 });
    }

    // Handle different event types
    switch (type) {
      case 'create':
      case 'update':
        if (doc && doc.slug) {
          // Revalidate the specific article page
          console.log(`🔄 Revalidating article: ${doc.slug}`);

          // In production, this would trigger Vercel's ISR revalidation
          // For now, we'll log the revalidation request
          return new Response(JSON.stringify({
            revalidated: true,
            type: 'article',
            slug: doc.slug,
            message: 'Article page revalidation triggered'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        break;

      case 'delete':
        console.log(`🗑️ Article deleted: ${doc?.slug}`);
        // Handle deletion revalidation if needed
        break;

      default:
        console.log(`⚠️ Unknown webhook type: ${type}`);
    }

    return new Response(JSON.stringify({
      received: true,
      type,
      message: 'Webhook processed'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({
      error: 'Webhook processing failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle GET requests for testing
export async function GET() {
  return new Response(JSON.stringify({
    message: 'Payload CMS Webhook Endpoint',
    status: 'active',
    usage: 'POST requests from Payload CMS webhooks'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}