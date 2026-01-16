import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64Data.length) {
    const chunk = base64Data.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Retry with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64 } = await req.json();

    if (!audioBase64) {
      throw new Error('No audio data provided');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Processing ASR request with Whisper...');

    // Convert base64 to binary
    const binaryAudio = processBase64Chunks(audioBase64);
    
    // Prepare form data for Whisper API
    const formData = new FormData();
    const arrayBuffer = binaryAudio.buffer.slice(binaryAudio.byteOffset, binaryAudio.byteOffset + binaryAudio.byteLength) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('prompt', 'This is a mathematical problem. Common terms: square root, squared, cubed, integral, derivative, probability, limit, sum, pi, theta.');

    // Send to OpenAI Whisper with retry
    const response = await fetchWithRetry('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    }, 3);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Whisper API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          extractedText: '',
          confidence: 0 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const result = await response.json();
    let extractedText = result.text || '';

    console.log('Raw transcription:', extractedText);

    // Post-process to convert spoken math to notation
    extractedText = extractedText
      .replace(/\bsquared\b/gi, '²')
      .replace(/\bcubed\b/gi, '³')
      .replace(/\bsquare root of\b/gi, '√')
      .replace(/\bsqrt of\b/gi, '√')
      .replace(/\bto the power of (\d+)\b/gi, '^$1')
      .replace(/\bpi\b/gi, 'π')
      .replace(/\btheta\b/gi, 'θ')
      .replace(/\balpha\b/gi, 'α')
      .replace(/\bbeta\b/gi, 'β')
      .replace(/\bintegral of\b/gi, '∫')
      .replace(/\bsum of\b/gi, 'Σ')
      .replace(/\binfinity\b/gi, '∞')
      .replace(/\bdelta\b/gi, 'Δ')
      .replace(/\bx squared\b/gi, 'x²')
      .replace(/\bx cubed\b/gi, 'x³');

    console.log('ASR transcription successful:', extractedText);

    return new Response(JSON.stringify({ 
      extractedText,
      confidence: 0.95
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ASR function:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      extractedText: '',
      confidence: 0 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
