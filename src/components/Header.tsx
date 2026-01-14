import { Brain, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-solver flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">Math Mentor</h1>
            <p className="text-xs text-muted-foreground">Multimodal AI Tutor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
            <span className="text-xs font-medium text-success">RAG + Agents + HITL</span>
          </div>
        </div>
      </div>
    </header>
  );
}
