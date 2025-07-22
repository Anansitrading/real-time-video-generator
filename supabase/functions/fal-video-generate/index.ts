Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const falApiKey = Deno.env.get('FAL_API_KEY');

    if (!supabaseUrl || !serviceRoleKey || !falApiKey) {
      throw new Error('Missing environment variables');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user token
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Invalid user token');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Get request data
    const { prompt, sessionId, duration = 5 } = await req.json();

    if (!prompt || !sessionId) {
      throw new Error('Prompt and session ID are required');
    }

    // Submit video generation request to Fal.ai
    const falResponse = await fetch('https://fal.run/fal-ai/veo-3', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: duration,
        aspect_ratio: '16:9',
        loop: false,
        webhook_url: `${supabaseUrl}/functions/v1/fal-video-webhook`
      })
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      throw new Error(`Fal.ai API error: ${errorText}`);
    }

    const falData = await falResponse.json();
    const requestId = falData.request_id;

    // Save video generation request to database
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        prompt: prompt,
        fal_request_id: requestId,
        status: 'queued',
        metadata: {
          duration: duration,
          aspect_ratio: '16:9',
          submitted_at: new Date().toISOString()
        }
      })
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Database insert failed: ${errorText}`);
    }

    const videoData = await insertResponse.json();

    return new Response(JSON.stringify({ 
      data: {
        videoId: videoData[0].id,
        requestId: requestId,
        status: 'queued',
        estimatedCompletionTime: new Date(Date.now() + 45 * 1000).toISOString() // ~45 seconds
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Video generation error:', error);

    const errorResponse = {
      error: {
        code: 'VIDEO_GENERATION_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});