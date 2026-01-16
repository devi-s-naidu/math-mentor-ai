import { useState, useCallback } from "react";
import {
  type AppState,
  type InputMode,
  type AgentState,
  type AgentType,
  type ParsedProblem,
  type Solution,
  type HITLRequest,
  type MemoryEntry,
} from "@/types/mathMentor";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const initialAgents: AgentState[] = [
  { type: "parser", status: "idle" },
  { type: "router", status: "idle" },
  { type: "solver", status: "idle" },
  { type: "verifier", status: "idle" },
  { type: "explainer", status: "idle" },
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

  const simulateAgentRun = useCallback(async (type: AgentType, duration: number, message?: string) => {
    const startTime = Date.now();
    updateAgent(type, { status: "running", startTime, message });
    await new Promise((r) => setTimeout(r, duration));
    const endTime = Date.now();
    updateAgent(type, { status: "completed", endTime, message: message || "Completed" });
  }, [updateAgent]);

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
      await simulateAgentRun("parser", 600, "Parsing input into structured format");
      
      const parsedProblem: ParsedProblem = detectProblemType(input);
      setState((prev) => ({ ...prev, parsedProblem }));

      // Router Agent
      await simulateAgentRun("router", 400, `Routing to ${parsedProblem.topic} solver`);

      // Solver Agent - Call real AI
      updateAgent("solver", { status: "running", startTime: Date.now(), message: "Calling AI solver..." });
      
      const { data, error } = await supabase.functions.invoke('math-solver', {
        body: { problemText: input, topic: parsedProblem.topic }
      });

      if (error) {
        updateAgent("solver", { status: "error", message: error.message });
        throw new Error(error.message);
      }

      if (data.error) {
        updateAgent("solver", { status: "error", message: data.error });
        throw new Error(data.error);
      }

      updateAgent("solver", { status: "completed", endTime: Date.now(), message: "Solution found" });

      // Verifier Agent
      const verificationMsg = data.verificationStatus === 'verified' 
        ? "Solution verified ✓" 
        : data.verificationStatus === 'uncertain'
        ? "Solution needs review"
        : "Verification failed";
      await simulateAgentRun("verifier", 300, verificationMsg);

      // Explainer Agent
      await simulateAgentRun("explainer", 300, "Explanation ready");

      // Set the solution from AI
      const solution: Solution = {
        steps: data.steps || [],
        finalAnswer: data.finalAnswer || "See steps above",
        confidence: data.confidence || 0.85,
        retrievedContext: data.retrievedContext || [],
        verificationStatus: data.verificationStatus || "uncertain",
        explanation: data.explanation || "Solution provided by AI.",
      };
      
      setState((prev) => ({ ...prev, solution }));

      toast({
        title: "Problem Solved!",
        description: "AI has solved your problem. Check the solution below.",
      });

    } catch (error) {
      console.error('Solver error:', error);
      updateAgent("solver", { status: "error", message: "Failed to solve" });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to solve the problem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [simulateAgentRun, updateAgent]);

  const processImage = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isProcessing: true }));
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call OCR edge function
      const { data, error } = await supabase.functions.invoke('ocr-extract', {
        body: { imageBase64 }
      });

      if (error) {
        throw new Error(error.message);
      }

      const extractedText = data.extractedText || '';
      const confidence = data.confidence || 0.5;

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

      toast({
        title: "Image processed",
        description: "Text extracted successfully. Review and confirm.",
      });
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: "OCR Failed",
        description: "Could not extract text from image. Please try again.",
        variant: "destructive",
      });
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, []);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    setState((prev) => ({ ...prev, isProcessing: true }));
    
    try {
      // Convert audio to base64
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Call ASR edge function
      const { data, error } = await supabase.functions.invoke('asr-transcribe', {
        body: { audioBase64 }
      });

      if (error) {
        throw new Error(error.message);
      }

      const extractedText = data.extractedText || '';
      
      setState((prev) => ({
        ...prev,
        extractedText,
        isProcessing: false,
      }));

      toast({
        title: "Audio processed",
        description: "Speech transcribed. Review and confirm.",
      });
    } catch (error) {
      console.error('ASR error:', error);
      toast({
        title: "Transcription Failed",
        description: "Could not transcribe audio. Please try again.",
        variant: "destructive",
      });
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
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

