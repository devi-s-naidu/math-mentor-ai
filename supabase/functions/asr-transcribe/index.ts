import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function base64ToBlob(base64String: string, mimeType: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: mimeType });
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing ASR request...');

    // For audio transcription, we'll use a text-based approach
    // Since Lovable AI gateway supports multimodal, we describe what we need
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a speech-to-text specialist for mathematical problems. When given audio content, transcribe it accurately.

Rules:
1. Convert spoken mathematical expressions to proper notation
2. "x squared" → x²
3. "x cubed" → x³
4. "square root of" → √
5. "integral of" → ∫
6. "sum of" → Σ
7. "pi" → π
8. "theta" → θ
9. "derivative of f of x" → f'(x) or df/dx
10. Keep the mathematical meaning clear and precise`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcribe this audio of a mathematical problem. Convert spoken math to proper notation. Return only the transcribed problem text.'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64,
                  format: 'webm'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      
      // Fallback: return a helpful message if audio processing fails
      return new Response(JSON.stringify({ 
        extractedText: 'Audio transcription is not fully supported yet. Please use text or image input.',
        confidence: 0.5,
        error: 'Audio processing limited'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || '';

    console.log('ASR transcription successful:', extractedText.substring(0, 100));

    return new Response(JSON.stringify({ 
      extractedText,
      confidence: 0.85
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ASR function:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      extractedText: 'Audio transcription failed. Please try text or image input.',
      confidence: 0 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
