import { useState } from "react";
import { Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

const exampleProblems = [
  "If P(A) = 0.3 and P(B) = 0.5, and A and B are independent, find P(A ∩ B)",
  "Find the derivative of f(x) = x³ + 2x² - 5x + 3",
  "Solve for x: 2x² - 5x + 3 = 0",
  "Find the limit as x approaches 0 of (sin x) / x",
];

export function TextInput({ onSubmit, disabled }: TextInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your math problem here... (e.g., 'Find the derivative of x² + 3x')"
          className="min-h-[140px] resize-none bg-card border-border focus:border-primary input-glow text-base"
          disabled={disabled}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">⌘ + Enter to submit</span>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            size="sm"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Solve
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-accent" />
          <span>Try an example:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {exampleProblems.map((problem, i) => (
            <button
              key={i}
              onClick={() => setText(problem)}
              disabled={disabled}
              className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
            >
              {problem}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
