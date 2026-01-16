import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { problemText, topic } = await req.json();

    if (!problemText || typeof problemText !== "string") {
      return new Response(
        JSON.stringify({ error: "No problem text provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Solving math problem:", problemText, "Topic:", topic);

    const systemPrompt = `You are an expert mathematics tutor and solver. Your task is to solve mathematical problems step-by-step with clear explanations.

You MUST respond using the solve_math_problem function with a structured solution.

Guidelines:
1. Break down the solution into clear, numbered steps
2. Show formulas and intermediate calculations
3. Provide the final answer clearly
4. Explain the reasoning in simple terms
5. Verify your answer is correct
6. Use proper mathematical notation (√, π, ², ³, ∫, Σ, etc.)

For each step, provide:
- A clear description of what you're doing
- The formula or operation being applied (if any)
- The result of that step (if applicable)`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Solve this ${topic || "mathematics"} problem step by step:\n\n${problemText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "solve_math_problem",
                description:
                  "Return a structured solution to a math problem with steps, final answer, and explanation.",
                parameters: {
                  type: "object",
                  properties: {
                    steps: {
                      type: "array",
                      description: "Array of solution steps",
                      items: {
                        type: "object",
                        properties: {
                          stepNumber: {
                            type: "number",
                            description: "The step number (1, 2, 3, ...)",
                          },
                          description: {
                            type: "string",
                            description:
                              "Clear description of what is being done in this step",
                          },
                          formula: {
                            type: "string",
                            description:
                              "The mathematical formula or expression being used (optional)",
                          },
                          result: {
                            type: "string",
                            description:
                              "The result or outcome of this step (optional)",
                          },
                        },
                        required: ["stepNumber", "description"],
                        additionalProperties: false,
                      },
                    },
                    finalAnswer: {
                      type: "string",
                      description:
                        "The final answer to the problem, clearly stated",
                    },
                    confidence: {
                      type: "number",
                      description:
                        "Confidence level in the solution (0.0 to 1.0)",
                    },
                    verificationStatus: {
                      type: "string",
                      enum: ["verified", "uncertain", "failed"],
                      description:
                        "Whether the solution was verified as correct",
                    },
                    explanation: {
                      type: "string",
                      description:
                        "A brief explanation of the overall approach and key insights",
                    },
                    retrievedContext: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Relevant mathematical concepts, formulas, or theorems used",
                    },
                  },
                  required: [
                    "steps",
                    "finalAnswer",
                    "confidence",
                    "verificationStatus",
                    "explanation",
                    "retrievedContext",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "solve_math_problem" },
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add funds to continue.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "solve_math_problem") {
      // Fallback: try to parse from content if no tool call
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        console.log("No tool call, using content fallback");
        return new Response(
          JSON.stringify({
            steps: [
              {
                stepNumber: 1,
                description: "AI provided solution",
                result: content,
              },
            ],
            finalAnswer: content,
            confidence: 0.8,
            verificationStatus: "uncertain",
            explanation: content,
            retrievedContext: [],
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      throw new Error("No valid solution received from AI");
    }

    let solution;
    try {
      solution = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool call arguments:", e);
      throw new Error("Failed to parse AI solution");
    }

    console.log("Parsed solution:", JSON.stringify(solution, null, 2));

    // Validate and ensure required fields
    const validatedSolution = {
      steps: Array.isArray(solution.steps) ? solution.steps : [],
      finalAnswer: solution.finalAnswer || "See steps above",
      confidence:
        typeof solution.confidence === "number" ? solution.confidence : 0.85,
      verificationStatus: ["verified", "uncertain", "failed"].includes(
        solution.verificationStatus,
      )
        ? solution.verificationStatus
        : "uncertain",
      explanation: solution.explanation || "Solution provided by AI.",
      retrievedContext: Array.isArray(solution.retrievedContext)
        ? solution.retrievedContext
        : [],
    };

    return new Response(JSON.stringify(validatedSolution), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error in math-solver function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
