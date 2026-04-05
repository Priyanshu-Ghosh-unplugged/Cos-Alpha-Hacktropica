import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { webhookHandler } from '../../lib/superplane/webhooks.ts';
import { blockchainComponents } from '../../lib/superplane/blockchain-components.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-superplane-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Route to appropriate handler
    switch (path) {
      case '/api/superplane/deployments':
        await handleDeployment(req);
        break;
      case '/api/superplane/security':
        await handleSecurity(req);
        break;
      case '/api/superplane/payments':
        await handlePayments(req);
        break;
      case '/api/superplane/components':
        await handleComponents(req);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('SuperPlane API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleDeployment(req: Request): Promise<Response> {
  const body = await req.json();
  const headers = Object.fromEntries(req.headers.entries());
  
  const webhookReq = { body, headers };
  const webhookRes = {
    status: (code: number) => ({
      json: (data: any) => {
        return new Response(
          JSON.stringify(data),
          { 
            status: code, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    })
  };

  await webhookHandler.handleDeploymentWebhook(webhookReq, webhookRes);
  return webhookRes.status(200).json({ message: 'Deployment webhook processed' });
}

async function handleSecurity(req: Request): Promise<Response> {
  const body = await req.json();
  const headers = Object.fromEntries(req.headers.entries());
  
  const webhookReq = { body, headers };
  const webhookRes = {
    status: (code: number) => ({
      json: (data: any) => {
        return new Response(
          JSON.stringify(data),
          { 
            status: code, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    })
  };

  await webhookHandler.handleSecurityAlert(webhookReq, webhookRes);
  return webhookRes.status(200).json({ message: 'Security alert processed' });
}

async function handlePayments(req: Request): Promise<Response> {
  const body = await req.json();
  const headers = Object.fromEntries(req.headers.entries());
  
  const webhookReq = { body, headers };
  const webhookRes = {
    status: (code: number) => ({
      json: (data: any) => {
        return new Response(
          JSON.stringify(data),
          { 
            status: code, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    })
  };

  await webhookHandler.handlePaymentWebhook(webhookReq, webhookRes);
  return webhookRes.status(200).json({ message: 'Payment webhook processed' });
}

async function handleComponents(req: Request): Promise<Response> {
  if (req.method === 'GET') {
    const components = Object.entries(blockchainComponents).map(([name, component]) => ({
      name,
      chain: component.chain,
      description: `${component.name} component for ${component.chain} operations`
    }));

    return new Response(
      JSON.stringify({ components }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const { component, params } = body;

    if (!blockchainComponents[component]) {
      return new Response(
        JSON.stringify({ error: 'Component not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const result = await blockchainComponents[component].execute(params);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Component execution failed' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
