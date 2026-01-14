import { Clock, CheckCircle, XCircle, Type, Image, Mic, Trash2 } from "lucide-react";
import { MemoryEntry, InputMode } from "@/types/mathMentor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MemoryPanelProps {
  entries: MemoryEntry[];
  onSelectEntry: (entry: MemoryEntry) => void;
  onClearMemory: () => void;
}

const modeIcons: Record<InputMode, typeof Type> = {
  text: Type,
  image: Image,
  audio: Mic,
};

export function MemoryPanel({ entries, onSelectEntry, onClearMemory }: MemoryPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Memory</h3>
          <span className="text-xs text-muted-foreground">({entries.length})</span>
        </div>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearMemory} className="h-7 px-2 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No solved problems yet</p>
              <p className="text-xs mt-1">Your solved problems will appear here</p>
            </div>
          ) : (
            entries.map((entry) => {
              const ModeIcon = modeIcons[entry.inputMode];
              return (
                <button
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    "hover:bg-muted/50 hover:border-primary/30",
                    entry.wasCorrect ? "border-success/30" : "border-destructive/30"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center shrink-0",
                      entry.wasCorrect ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      {entry.wasCorrect ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ModeIcon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">
                          {entry.parsedProblem.topic}
                        </span>
                      </div>
                      <p className="text-sm text-foreground truncate">
                        {entry.parsedProblem.problemText}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.timestamp).toLocaleDateString()} at{" "}
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
