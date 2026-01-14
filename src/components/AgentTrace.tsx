import { Check, Loader2, AlertCircle, Clock, Hand } from "lucide-react";
import { AgentState, AgentType } from "@/types/mathMentor";
import { cn } from "@/lib/utils";

interface AgentTraceProps {
  agents: AgentState[];
}

const agentConfig: Record<AgentType, { label: string; description: string }> = {
  parser: { label: "Parser", description: "Converting input to structured problem" },
  router: { label: "Router", description: "Classifying problem type & routing" },
  solver: { label: "Solver", description: "Solving with RAG + tools" },
  verifier: { label: "Verifier", description: "Checking correctness & edge cases" },
  explainer: { label: "Explainer", description: "Creating step-by-step explanation" },
};

const statusIcon = {
  idle: Clock,
  running: Loader2,
  completed: Check,
  error: AlertCircle,
  "waiting-hitl": Hand,
};

export function AgentTrace({ agents }: AgentTraceProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm">Agent Trace</h3>
      </div>
      <div className="p-4 space-y-3">
        {agents.map((agent, index) => {
          const Icon = statusIcon[agent.status];
          const config = agentConfig[agent.type];
          const isActive = agent.status === "running";
          const isComplete = agent.status === "completed";
          const isHitl = agent.status === "waiting-hitl";

          return (
            <div
              key={agent.type}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-lg transition-all duration-300",
                isActive && "bg-primary/10 border border-primary/30",
                isComplete && "bg-success/5",
                isHitl && "bg-warning/10 border border-warning/30",
                !isActive && !isComplete && !isHitl && "opacity-50"
              )}
            >
              {/* Connector line */}
              {index < agents.length - 1 && (
                <div className={cn(
                  "absolute left-[26px] top-[52px] w-0.5 h-[calc(100%-8px)]",
                  isComplete ? "bg-success/50" : "bg-border"
                )} />
              )}

              {/* Status icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                `agent-${agent.type}`
              )}>
                <Icon className={cn(
                  "w-4 h-4",
                  isActive && "animate-spin"
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`agent-badge agent-${agent.type}`}>
                    {config.label}
                  </span>
                  {agent.endTime && agent.startTime && (
                    <span className="text-xs text-muted-foreground">
                      {((agent.endTime - agent.startTime) / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {agent.message || config.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
