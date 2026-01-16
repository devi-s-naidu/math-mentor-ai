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
    const { audioBase64 } = await req.json();

    if (!audioBase64) {
      throw new Error('No audio data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Processing ASR request with Lovable AI...');

    // Extract base64 data without the data URL prefix
    const base64Data = audioBase64.includes(',') 
      ? audioBase64.split(',')[1] 
      : audioBase64;
    
    // Detect format from data URL
    let format = 'mp3'; // default
    if (audioBase64.includes('audio/wav')) {
      format = 'wav';
    } else if (audioBase64.includes('audio/mp3') || audioBase64.includes('audio/mpeg')) {
      format = 'mp3';
    }
    // Note: webm is not supported, but we'll try mp3 as it might work for some cases

    console.log('Audio format detected:', format);

    // Use GPT-5 which supports audio input
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          {
            role: 'system',
            content: `You are a speech-to-text transcription specialist for mathematical problems.

Your task: Transcribe the spoken audio EXACTLY as heard, then convert spoken math terms to proper notation.

Conversion rules:
- "squared" → ²
- "cubed" → ³  
- "square root of" → √
- "to the power of [n]" → ^n
- "pi" → π
- "theta" → θ
- "integral of" → ∫
- "sum of" → Σ
- "infinity" → ∞
- "delta" → Δ
- "plus" → +
- "minus" → -
- "times" or "multiplied by" → ×
- "divided by" → ÷
- "equals" → =

Return ONLY the transcribed and converted mathematical problem text. No explanations.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcribe this audio recording of a mathematical problem. Apply the conversion rules for math notation.'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Data,
                  format: format
                }
              }
            ]
          }
        ],
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      
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
      
      // If audio format is not supported, provide a helpful message
      if (response.status === 400 && errorText.includes('format')) {
        return new Response(JSON.stringify({ 
          error: 'Audio format not supported. Please try using text or image input instead.',
          extractedText: '',
          confidence: 0 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let extractedText = data.choices?.[0]?.message?.content?.trim() || '';

    console.log('ASR transcription successful:', extractedText);

    // Additional post-processing for common patterns
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
      .replace(/\bdelta\b/gi, 'Δ');

    return new Response(JSON.stringify({ 
      extractedText,
      confidence: 0.90
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
