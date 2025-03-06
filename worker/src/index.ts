interface Env {
  AUDIO_BUCKET: R2Bucket;
  ALLOWED_ORIGIN: string;
  UPLOAD_TOKEN: string;
  PUBLIC_URL: string;
}

interface MessageMetadata {
  guestName: string;
  timestamp: string;
  duration: number;
  originalFilename?: string;
}

/**
 * Generate CORS headers based on the configured allowed origin
 */
function getCorsHeaders(env: Env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Token',
  };
};

async function handleOptions(request: Request, env: Env) {
  if (request.headers.get('Origin') !== null) {
    return new Response(null, {
      headers: getCorsHeaders(env),
    });
  }
  return new Response(null, {
    headers: {
      Allow: 'GET, POST, OPTIONS',
    },
  });
}

function validateAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('X-Upload-Token');
  return authHeader === env.UPLOAD_TOKEN;
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  // Validate auth token
  if (!validateAuth(request, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const metadata = JSON.parse(formData.get('metadata') as string) as MessageMetadata;

    if (!audioFile || !metadata) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return new Response('Invalid file type', { status: 400 });
    }

    // Generate unique filename with timestamp, guest name, and extension from content type
    const fileExt = audioFile.type === 'audio/webm' ? 'webm' : 
                    audioFile.type === 'audio/wav' ? 'wav' : 
                    audioFile.type === 'audio/mp4' ? 'm4a' : 'audio';
    
    const filename = `${Date.now()}-${metadata.guestName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExt}`;

    // Upload to R2
    await env.AUDIO_BUCKET.put(filename, audioFile, {
      customMetadata: {
        guestName: metadata.guestName,
        timestamp: metadata.timestamp,
        duration: metadata.duration.toString(),
        originalFilename: metadata.originalFilename || filename,
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      filename,
      url: `${env.PUBLIC_URL || ''}/${filename}`
    }), {
      headers: {
        ...getCorsHeaders(env),
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to upload file'
    }), { 
      status: 500,
      headers: {
        ...getCorsHeaders(env),
        'Content-Type': 'application/json',
      },
    });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return handleOptions(request, env);
      }

      // Only allow POST requests to /upload
      if (request.method === 'POST') {
        const url = new URL(request.url);
        if (url.pathname === '/upload') {
          return handleUpload(request, env);
        }
      }

      // Handle get request to check if service is running
      if (request.method === 'GET') {
        const url = new URL(request.url);
        if (url.pathname === '/status') {
          return new Response(JSON.stringify({ status: 'ok' }), {
            headers: {
              ...getCorsHeaders(env),
              'Content-Type': 'application/json',
            },
          });
        }
      }

      return new Response('Not Found', { 
        status: 404,
        headers: getCorsHeaders(env)
      });
    } catch (error) {
      console.error('Unhandled error in worker:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { 
        status: 500,
        headers: {
          ...getCorsHeaders(env),
          'Content-Type': 'application/json',
        },
      });
    }
  },
} satisfies ExportedHandler<Env>;
