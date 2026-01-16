import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing OCR request...');

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
            content: `You are an OCR specialist for mathematical problems. Extract the exact mathematical text from the image.

Rules:
1. Extract ONLY the mathematical problem text - no explanations
2. Preserve all mathematical notation (use proper unicode: ², ³, √, ∫, ∑, π, θ, etc.)
3. Keep equations on separate lines if there are multiple
4. If the image contains handwritten text, do your best to interpret it accurately
5. If confidence is low, indicate uncertain parts with [?]
6. Do NOT solve the problem - only extract what is written`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the mathematical problem text from this image. Return only the extracted text, nothing else.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
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
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content?.trim() || '';

    console.log('OCR extraction successful:', extractedText.substring(0, 100));

    // Estimate confidence based on response characteristics
    const hasUncertainMarkers = extractedText.includes('[?]');
    const confidence = hasUncertainMarkers ? 0.6 : 0.92;

    return new Response(JSON.stringify({ 
      extractedText,
      confidence
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in OCR function:', error);
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
