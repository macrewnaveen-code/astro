import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('Webhook received:', body);

    // Verify webhook secret if needed
    const signature = request.headers.get('x-payload-signature');
    // Add signature verification logic here if needed

    // Trigger rebuild (you can integrate with GitHub Actions, Vercel, etc.)
    // For now, just log the webhook
    console.log('Payload webhook triggered for:', {
      type: body.type,
      operation: body.operation,
      id: body.id
    });

    // Here you could:
    // 1. Trigger GitHub Actions rebuild
    // 2. Clear cache
    // 3. Send notification
    // 4. Update search index

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook processed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};