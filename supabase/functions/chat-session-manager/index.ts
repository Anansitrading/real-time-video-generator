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

    if (!supabaseUrl || !serviceRoleKey) {
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

    const { action, sessionId, messageData, title, language = 'en' } = await req.json();

    let result = {};

    switch (action) {
      case 'create_session':
        // Create new chat session
        const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/chat_sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: userId,
            title: title || 'New Conversation',
            language: language,
            status: 'active'
          })
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to create session');
        }

        result = await sessionResponse.json();
        break;

      case 'add_message':
        // Add message to session
        if (!sessionId || !messageData) {
          throw new Error('Session ID and message data required');
        }

        const messageResponse = await fetch(`${supabaseUrl}/rest/v1/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            session_id: sessionId,
            role: messageData.role,
            content: messageData.content,
            audio_url: messageData.audio_url || null,
            metadata: messageData.metadata || {}
          })
        });

        if (!messageResponse.ok) {
          throw new Error('Failed to add message');
        }

        result = await messageResponse.json();

        // Update session timestamp
        await fetch(`${supabaseUrl}/rest/v1/chat_sessions?id=eq.${sessionId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            updated_at: new Date().toISOString()
          })
        });
        break;

      case 'get_sessions':
        // Get user's chat sessions
        const sessionsResponse = await fetch(`${supabaseUrl}/rest/v1/chat_sessions?user_id=eq.${userId}&order=updated_at.desc`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });

        if (!sessionsResponse.ok) {
          throw new Error('Failed to get sessions');
        }

        result = await sessionsResponse.json();
        break;

      case 'get_messages':
        // Get messages for a session
        if (!sessionId) {
          throw new Error('Session ID required');
        }

        const messagesResponse = await fetch(`${supabaseUrl}/rest/v1/messages?session_id=eq.${sessionId}&order=created_at.asc`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });

        if (!messagesResponse.ok) {
          throw new Error('Failed to get messages');
        }

        result = await messagesResponse.json();
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Session management error:', error);

    const errorResponse = {
      error: {
        code: 'SESSION_MANAGEMENT_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});