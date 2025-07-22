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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing environment variables');
    }

    // Get webhook data from Fal.ai
    const webhookData = await req.json();
    const { request_id, status, output, error } = webhookData;

    if (!request_id) {
      throw new Error('Missing request_id in webhook data');
    }

    // Find the video record by fal_request_id
    const queryResponse = await fetch(`${supabaseUrl}/rest/v1/videos?fal_request_id=eq.${request_id}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    if (!queryResponse.ok) {
      throw new Error('Failed to query video record');
    }

    const videos = await queryResponse.json();
    if (videos.length === 0) {
      throw new Error(`No video found with request_id: ${request_id}`);
    }

    const video = videos[0];
    let updateData = {
      status: status,
      completed_at: new Date().toISOString()
    };

    if (status === 'completed' && output) {
      // Extract video URL and other data from output
      updateData.video_url = output.video?.url || output.url;
      updateData.duration_seconds = output.duration || null;
      
      // Generate thumbnail if available
      if (output.thumbnail) {
        updateData.thumbnail_url = output.thumbnail.url;
      }
    } else if (status === 'failed' && error) {
      updateData.error_message = error.message || 'Video generation failed';
    }

    // Update the video record
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/videos?id=eq.${video.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update video record: ${errorText}`);
    }

    const updatedVideo = await updateResponse.json();

    console.log(`Video ${video.id} updated with status: ${status}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Webhook processed successfully',
      videoId: video.id,
      status: status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    const errorResponse = {
      error: {
        code: 'WEBHOOK_PROCESSING_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});