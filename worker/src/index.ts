interface Env {
  AUDIO_BUCKET: R2Bucket;
  ALLOWED_ORIGIN: string;
  UPLOAD_TOKEN: string;
}

interface MessageMetadata {
  guestName: string;
  timestamp: string;
  duration: number;
}

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Token',
};

async function handleOptions(request: Request) {
  if (request.headers.get('Origin') !== null) {
    return new Response(null, {
      headers: corsHeaders,
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

    // Generate unique filename
    const filename = `${Date.now()}-${metadata.guestName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webm`;

    // Upload to R2
    await env.AUDIO_BUCKET.put(filename, audioFile, {
      customMetadata: {
        guestName: metadata.guestName,
        timestamp: metadata.timestamp,
        duration: metadata.duration.toString(),
      },
    });

    return new Response(JSON.stringify({ success: true, filename }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Only allow POST requests to /upload
    if (request.method === 'POST') {
      const url = new URL(request.url);
      if (url.pathname === '/upload') {
        return handleUpload(request, env);
      }
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
