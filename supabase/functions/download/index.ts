import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Basic CORS headers to allow browser fetching
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // We expect ?url= and ?filename=
    const audioUrl = url.searchParams.get('url')
    const filename = url.searchParams.get('filename') || 'song.mp3'

    if (!audioUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Server-side fetch to Westnilebiz (bypasses browser CORS & SameOrigin constraints)
    console.log(`Proxying download for: ${audioUrl}`)
    const audioResponse = await fetch(audioUrl)

    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch upstream audio: ${audioResponse.statusText}`)
    }

    // Pipe the response stream directly back to the client while injecting forcing headers
    return new Response(audioResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        // This forces the "Save As" dialogue native prompt!
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        // Pass along caching if needed
        "Cache-Control": "public, max-age=3600"
      },
    })

  } catch (error) {
    console.error('Download Proxy Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
