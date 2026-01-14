import { useState, useCallback } from "react";
import {
  AppState,
  InputMode,
  AgentState,
  AgentType,
  ParsedProblem,
  Solution,
  HITLRequest,
  MemoryEntry,
} from "@/types/mathMentor";
import { toast } from "@/hooks/use-toast";

const initialAgents: AgentState[] = [
  { type: "parser", status: "idle" },
  { type: "router", status: "idle" },
  { type: "solver", status: "idle" },
  { type: "verifier", status: "idle" },
  { type: "explainer", status: "idle" },
];

// Simulated knowledge base for RAG
const knowledgeBase = [
  "For probability of independent events: P(A ∩ B) = P(A) × P(B)",
  "Derivative power rule: d/dx[x^n] = n × x^(n-1)",
  "Quadratic formula: x = (-b ± √(b²-4ac)) / 2a",
  "L'Hôpital's Rule: lim[f(x)/g(x)] = lim[f'(x)/g'(x)] when 0/0 or ∞/∞",
  "Chain rule: d/dx[f(g(x))] = f'(g(x)) × g'(x)",
  "Integration by parts: ∫u dv = uv - ∫v du",
  "Matrix multiplication: (AB)ij = Σk(Aik × Bkj)",
];

export function useMathMentor() {
  const [state, setState] = useState<AppState>({
    inputMode: "text",
    currentInput: "",
    extractedText: "",
    parsedProblem: null,
    solution: null,
    agents: initialAgents,
    hitlRequest: null,
    isProcessing: false,
    memory: [],
  });

  const setInputMode = useCallback((mode: InputMode) => {
    setState((prev) => ({ ...prev, inputMode: mode }));
  }, []);

  const updateAgent = useCallback((type: AgentType, update: Partial<AgentState>) => {
    setState((prev) => ({
      ...prev,
      agents: prev.agents.map((a) =>
        a.type === type ? { ...a, ...update } : a
      ),
    }));
  }, []);

  const simulateAgentRun = async (type: AgentType, duration: number, message?: string) => {
    const startTime = Date.now();
    updateAgent(type, { status: "running", startTime, message });
    await new Promise((r) => setTimeout(r, duration));
    const endTime = Date.now();
    updateAgent(type, { status: "completed", endTime, message: message || "Completed" });
  };

  const solveProblem = useCallback(async (input: string) => {
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      currentInput: input,
      solution: null,
      agents: initialAgents,
    }));

    try {
      // Parser Agent
      await simulateAgentRun("parser", 800, "Parsing input into structured format");
      
      const parsedProblem: ParsedProblem = detectProblemType(input);
      setState((prev) => ({ ...prev, parsedProblem }));

      // Router Agent
      await simulateAgentRun("router", 500, `Routing to ${parsedProblem.topic} solver`);

      // Solver Agent with RAG
      updateAgent("solver", { status: "running", startTime: Date.now(), message: "Retrieving relevant knowledge..." });
      await new Promise((r) => setTimeout(r, 600));
      
      const retrievedContext = retrieveContext(parsedProblem.topic);
      updateAgent("solver", { message: "Applying solution strategy..." });
      await new Promise((r) => setTimeout(r, 800));
      updateAgent("solver", { status: "completed", endTime: Date.now(), message: "Solution found" });

      // Verifier Agent
      await simulateAgentRun("verifier", 700, "Verifying solution correctness");

      // Explainer Agent
      await simulateAgentRun("explainer", 600, "Generating step-by-step explanation");

      // Generate solution
      const solution = generateSolution(parsedProblem, retrievedContext);
      setState((prev) => ({ ...prev, solution }));

      toast({
        title: "Problem Solved!",
        description: "Check the solution below.",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to solve the problem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, []);

  const processImage = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isProcessing: true }));
    
    // Simulate OCR processing
    await new Promise((r) => setTimeout(r, 1500));
    
    // Simulated OCR result
    const extractedText = "Find the derivative of f(x) = x³ + 2x² - 5x + 3";
    const confidence = 0.87;
    
    setState((prev) => ({
      ...prev,
      extractedText,
      isProcessing: false,
    }));

    if (confidence < 0.7) {
      setState((prev) => ({
        ...prev,
        hitlRequest: {
          id: crypto.randomUUID(),
          type: "ocr-correction",
          originalContent: extractedText,
          message: "The OCR confidence is low. Please review and correct the extracted text.",
          resolved: false,
        },
      }));
    }
  }, []);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setState((prev) => ({ ...prev, isProcessing: true }));
    
    // Simulate ASR processing
    await new Promise((r) => setTimeout(r, 2000));
    
    // Simulated transcription
    const extractedText = "What is the probability of getting heads twice when flipping a fair coin two times?";
    
    setState((prev) => ({
      ...prev,
      extractedText,
      isProcessing: false,
    }));
  }, []);

  const confirmExtraction = useCallback((text: string) => {
    solveProblem(text);
  }, [solveProblem]);

  const rejectExtraction = useCallback(() => {
    setState((prev) => ({ ...prev, extractedText: "" }));
  }, []);

  const handleHITLApprove = useCallback((correctedContent?: string) => {
    const content = correctedContent || state.hitlRequest?.originalContent;
    setState((prev) => ({ ...prev, hitlRequest: null }));
    if (content) {
      solveProblem(content);
    }
  }, [state.hitlRequest, solveProblem]);

  const handleHITLReject = useCallback(() => {
    setState((prev) => ({ ...prev, hitlRequest: null, extractedText: "" }));
    toast({
      title: "Input rejected",
      description: "Please try again with a clearer input.",
    });
  }, []);

  const handleFeedback = useCallback((correct: boolean, comment?: string) => {
    if (!state.parsedProblem || !state.solution) return;

    const memoryEntry: MemoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      inputMode: state.inputMode,
      originalInput: state.currentInput,
      parsedProblem: state.parsedProblem,
      solution: state.solution,
      wasCorrect: correct,
      userFeedback: comment,
    };

    setState((prev) => ({
      ...prev,
      memory: [memoryEntry, ...prev.memory],
    }));

    toast({
      title: correct ? "Thanks for the feedback!" : "We'll improve!",
      description: correct 
        ? "This solution has been saved to memory."
        : "Your correction helps us learn.",
    });
  }, [state.parsedProblem, state.solution, state.inputMode, state.currentInput]);

  const selectMemoryEntry = useCallback((entry: MemoryEntry) => {
    setState((prev) => ({
      ...prev,
      parsedProblem: entry.parsedProblem,
      solution: entry.solution,
      currentInput: entry.originalInput,
    }));
  }, []);

  const clearMemory = useCallback(() => {
    setState((prev) => ({ ...prev, memory: [] }));
    toast({ title: "Memory cleared" });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentInput: "",
      extractedText: "",
      parsedProblem: null,
      solution: null,
      agents: initialAgents,
      hitlRequest: null,
      isProcessing: false,
    }));
  }, []);

  return {
    state,
    setInputMode,
    solveProblem,
    processImage,
    processAudio,
    confirmExtraction,
    rejectExtraction,
    handleHITLApprove,
    handleHITLReject,
    handleFeedback,
    selectMemoryEntry,
    clearMemory,
    reset,
  };
}

// Helper functions

function detectProblemType(input: string): ParsedProblem {
  const lower = input.toLowerCase();
  let topic: ParsedProblem["topic"] = "unknown";
  
  if (lower.includes("probability") || lower.includes("p(") || lower.includes("coin") || lower.includes("dice")) {
    topic = "probability";
  } else if (lower.includes("derivative") || lower.includes("d/dx") || lower.includes("limit") || lower.includes("integral")) {
    topic = "calculus";
  } else if (lower.includes("matrix") || lower.includes("vector") || lower.includes("eigenvalue")) {
    topic = "linear-algebra";
  } else if (lower.includes("solve") || lower.includes("equation") || lower.includes("x =") || lower.includes("x²")) {
    topic = "algebra";
  }

  // Extract variables (simple regex for demonstration)
  const variables = Array.from(new Set(input.match(/[a-z]/gi) || [])).filter(
    (v) => ["x", "y", "z", "n", "a", "b", "c"].includes(v.toLowerCase())
  );

  return {
    problemText: input,
    topic,
    variables,
    constraints: [],
    needsClarification: false,
  };
}

function retrieveContext(topic: string): string[] {
  return knowledgeBase.filter((kb) => {
    const lower = kb.toLowerCase();
    switch (topic) {
      case "probability":
        return lower.includes("probability");
      case "calculus":
        return lower.includes("derivative") || lower.includes("limit") || lower.includes("integral");
      case "algebra":
        return lower.includes("quadratic") || lower.includes("equation");
      default:
        return true;
    }
  }).slice(0, 3);
}

function generateSolution(problem: ParsedProblem, retrievedContext: string[]): Solution {
  // Demo solutions based on topic
  const solutions: Record<string, Solution> = {
    probability: {
      steps: [
        { stepNumber: 1, description: "Identify the events and their probabilities", formula: "P(A) and P(B) given" },
        { stepNumber: 2, description: "Apply the multiplication rule for independent events", formula: "P(A ∩ B) = P(A) × P(B)" },
        { stepNumber: 3, description: "Substitute the values", formula: "P(A ∩ B) = 0.3 × 0.5", result: "0.15" },
      ],
      finalAnswer: "P(A ∩ B) = 0.15",
      confidence: 0.95,
      retrievedContext,
      verificationStatus: "verified",
      explanation: "For independent events, the probability of both occurring is the product of their individual probabilities. Since A and B are independent, we simply multiply P(A) = 0.3 by P(B) = 0.5 to get 0.15.",
    },
    calculus: {
      steps: [
        { stepNumber: 1, description: "Identify the function to differentiate", formula: "f(x) = x³ + 2x² - 5x + 3" },
        { stepNumber: 2, description: "Apply the power rule to each term", formula: "d/dx[xⁿ] = n·xⁿ⁻¹" },
        { stepNumber: 3, description: "Differentiate x³", formula: "d/dx[x³] = 3x²" },
        { stepNumber: 4, description: "Differentiate 2x²", formula: "d/dx[2x²] = 4x" },
        { stepNumber: 5, description: "Differentiate -5x", formula: "d/dx[-5x] = -5" },
        { stepNumber: 6, description: "Constant term derivative is 0", formula: "d/dx[3] = 0" },
        { stepNumber: 7, description: "Combine all terms", result: "f'(x) = 3x² + 4x - 5" },
      ],
      finalAnswer: "f'(x) = 3x² + 4x - 5",
      confidence: 0.98,
      retrievedContext,
      verificationStatus: "verified",
      explanation: "Using the power rule, we differentiate each term separately. For x³, bring down the exponent (3) and reduce it by 1, giving 3x². For 2x², we get 4x. For -5x, the derivative is -5. The constant 3 has a derivative of 0.",
    },
    algebra: {
      steps: [
        { stepNumber: 1, description: "Identify the quadratic equation", formula: "2x² - 5x + 3 = 0" },
        { stepNumber: 2, description: "Identify coefficients: a = 2, b = -5, c = 3" },
        { stepNumber: 3, description: "Calculate discriminant", formula: "Δ = b² - 4ac = 25 - 24 = 1" },
        { stepNumber: 4, description: "Apply quadratic formula", formula: "x = (5 ± √1) / 4" },
        { stepNumber: 5, description: "Calculate both solutions", result: "x₁ = 3/2, x₂ = 1" },
      ],
      finalAnswer: "x = 3/2 or x = 1",
      confidence: 0.97,
      retrievedContext,
      verificationStatus: "verified",
      explanation: "This is a standard quadratic equation. We use the quadratic formula with a=2, b=-5, and c=3. The discriminant is positive (Δ=1), indicating two real solutions.",
    },
    "linear-algebra": {
      steps: [
        { stepNumber: 1, description: "Set up the problem in matrix form" },
        { stepNumber: 2, description: "Apply appropriate matrix operations" },
        { stepNumber: 3, description: "Calculate the result" },
      ],
      finalAnswer: "See detailed solution",
      confidence: 0.85,
      retrievedContext,
      verificationStatus: "verified",
      explanation: "Linear algebra problems require careful matrix manipulation. The solution involves standard operations.",
    },
    unknown: {
      steps: [
        { stepNumber: 1, description: "Analyze the problem structure" },
        { stepNumber: 2, description: "Apply general mathematical principles" },
        { stepNumber: 3, description: "Derive the solution" },
      ],
      finalAnswer: "Solution derived",
      confidence: 0.75,
      retrievedContext,
      verificationStatus: "uncertain",
      explanation: "The problem type was not clearly identified. Please verify the solution manually.",
    },
  };

  return solutions[problem.topic] || solutions.unknown;
}
