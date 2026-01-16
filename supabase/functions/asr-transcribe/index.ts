import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function parseDataUrl(dataUrl: string): { mimeType: string; bytes: Uint8Array } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    // If it's just base64 without a data URL prefix, we can't reliably infer MIME type.
    // Default to webm since that's what browsers commonly produce for MediaRecorder.
    const mimeType = "audio/webm";
    const b64 = dataUrl;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { mimeType, bytes };
  }

  const mimeType = match[1];
  const b64 = match[2];
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { mimeType, bytes };
}

function mimeToExtension(mimeType: string): string {
  const mt = mimeType.toLowerCase();
  if (mt.includes("webm")) return "webm";
  if (mt.includes("ogg")) return "ogg";
  if (mt.includes("wav")) return "wav";
  if (mt.includes("mpeg") || mt.includes("mp3")) return "mp3";
  if (mt.includes("mp4")) return "mp4";
  if (mt.includes("m4a")) return "m4a";
  return "bin";
}

function postProcessMathNotation(text: string): string {
  return text
    .replace(/\bsquared\b/gi, "²")
    .replace(/\bcubed\b/gi, "³")
    .replace(/\bsquare root of\b/gi, "√")
    .replace(/\bsqrt of\b/gi, "√")
    .replace(/\bto the power of (\d+)\b/gi, "^$1")
    .replace(/\bpi\b/gi, "π")
    .replace(/\btheta\b/gi, "θ")
    .replace(/\balpha\b/gi, "α")
    .replace(/\bbeta\b/gi, "β")
    .replace(/\bintegral of\b/gi, "∫")
    .replace(/\bsum of\b/gi, "Σ")
    .replace(/\binfinity\b/gi, "∞")
    .replace(/\bdelta\b/gi, "Δ");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64 } = await req.json();

    if (!audioBase64 || typeof audioBase64 !== "string") {
      return new Response(
        JSON.stringify({
          error: "No audio data provided",
          extractedText: "",
          confidence: 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY not configured",
          extractedText: "",
          confidence: 0,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Processing ASR request with OpenAI transcription API...");

    const { mimeType, bytes } = parseDataUrl(audioBase64);
    const ext = mimeToExtension(mimeType);

    console.log("Audio mimeType:", mimeType, "ext:", ext, "bytes:", bytes.length);

    const file = new File([bytes.buffer as ArrayBuffer], `audio.${ext}`, { type: mimeType });
    const form = new FormData();
    form.append("file", file);
    form.append("model", "whisper-1");

    // Optional: helps math / symbols slightly in some cases
    form.append(
      "prompt",
      "Transcribe mathematical expressions accurately. Use symbols like + - * / =, √, π when appropriate.",
    );

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: form,
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error("OpenAI transcription error:", response.status, raw);

      // Pass through the upstream status so the client sees the real cause (429 quota, 400 bad audio, etc.)
      return new Response(
        JSON.stringify({
          error: `Transcription API error: ${response.status}`,
          details: raw,
          extractedText: "",
          confidence: 0,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let extractedText = "";
    try {
      const json = JSON.parse(raw);
      extractedText = (json?.text ?? "").toString().trim();
    } catch (e) {
      console.error("Failed to parse transcription JSON:", e);
      return new Response(
        JSON.stringify({
          error: "Failed to parse transcription response",
          extractedText: "",
          confidence: 0,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    extractedText = postProcessMathNotation(extractedText);

    console.log("ASR transcription successful:", extractedText);

    return new Response(
      JSON.stringify({
        extractedText,
        confidence: 0.9,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in ASR function:", error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        extractedText: "",
        confidence: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
