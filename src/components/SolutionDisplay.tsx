import { CheckCircle, XCircle, AlertCircle, BookOpen, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { Solution } from "@/types/mathMentor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SolutionDisplayProps {
  solution: Solution;
  onFeedback: (correct: boolean, comment?: string) => void;
}

export function SolutionDisplay({ solution, onFeedback }: SolutionDisplayProps) {
  const verificationIcon = {
    verified: CheckCircle,
    uncertain: AlertCircle,
    failed: XCircle,
  };

  const VerificationIcon = verificationIcon[solution.verificationStatus];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Final Answer */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Final Answer</h3>
            <div className="text-2xl font-bold font-math text-foreground">
              {solution.finalAnswer}
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
            solution.verificationStatus === 'verified' && "bg-success/20 text-success",
            solution.verificationStatus === 'uncertain' && "bg-warning/20 text-warning",
            solution.verificationStatus === 'failed' && "bg-destructive/20 text-destructive"
          )}>
            <VerificationIcon className="w-4 h-4" />
            <span className="capitalize">{solution.verificationStatus}</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Confidence:</div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[200px]">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${solution.confidence * 100}%` }}
            />
          </div>
          <div className="text-xs font-medium">{Math.round(solution.confidence * 100)}%</div>
        </div>
      </div>

      {/* Step-by-step solution */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-explainer" />
          <h3 className="font-semibold text-sm">Step-by-Step Solution</h3>
        </div>
        
        <div className="p-4 space-y-4">
          {solution.steps.map((step, index) => (
            <div 
              key={step.stepNumber} 
              className="flex gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {step.stepNumber}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-foreground">{step.description}</p>
                {step.formula && (
                  <div className="math-formula font-math">
                    {step.formula}
                  </div>
                )}
                {step.result && (
                  <p className="text-sm text-success font-medium">
                    → {step.result}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">💡 Explanation</h4>
        <p className="text-foreground leading-relaxed">{solution.explanation}</p>
      </div>

      {/* Retrieved Context */}
      {solution.retrievedContext.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm">📚 Retrieved Knowledge</h3>
          </div>
          <div className="p-4 space-y-2">
            {solution.retrievedContext.map((ctx, i) => (
              <div key={i} className="text-sm text-muted-foreground p-2 rounded bg-muted/50 border-l-2 border-primary">
                {ctx}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="font-medium text-sm text-muted-foreground mb-3">Was this solution helpful?</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFeedback(true)}
            className="gap-2 hover:bg-success/10 hover:text-success hover:border-success/50"
          >
            <ThumbsUp className="w-4 h-4" />
            Correct
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFeedback(false)}
            className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          >
            <ThumbsDown className="w-4 h-4" />
            Incorrect
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
