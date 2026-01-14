export type InputMode = 'text' | 'image' | 'audio';

export type AgentType = 'parser' | 'router' | 'solver' | 'verifier' | 'explainer';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'error' | 'waiting-hitl';

export interface AgentState {
  type: AgentType;
  status: AgentStatus;
  message?: string;
  startTime?: number;
  endTime?: number;
}

export interface ParsedProblem {
  problemText: string;
  topic: 'algebra' | 'probability' | 'calculus' | 'linear-algebra' | 'unknown';
  variables: string[];
  constraints: string[];
  needsClarification: boolean;
  clarificationReason?: string;
}

export interface SolutionStep {
  stepNumber: number;
  description: string;
  formula?: string;
  result?: string;
}

export interface Solution {
  steps: SolutionStep[];
  finalAnswer: string;
  confidence: number;
  retrievedContext: string[];
  verificationStatus: 'verified' | 'uncertain' | 'failed';
  explanation: string;
}

export interface HITLRequest {
  id: string;
  type: 'ocr-correction' | 'asr-correction' | 'clarification' | 'verification';
  originalContent: string;
  suggestedContent?: string;
  message: string;
  resolved: boolean;
  userResponse?: string;
}

export interface MemoryEntry {
  id: string;
  timestamp: Date;
  inputMode: InputMode;
  originalInput: string;
  parsedProblem: ParsedProblem;
  solution: Solution;
  wasCorrect: boolean;
  userFeedback?: string;
}

export interface AppState {
  inputMode: InputMode;
  currentInput: string;
  extractedText: string;
  parsedProblem: ParsedProblem | null;
  solution: Solution | null;
  agents: AgentState[];
  hitlRequest: HITLRequest | null;
  isProcessing: boolean;
  memory: MemoryEntry[];
}
