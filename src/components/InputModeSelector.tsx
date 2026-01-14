import { Type, Image, Mic } from "lucide-react";
import { InputMode } from "@/types/mathMentor";
import { cn } from "@/lib/utils";

interface InputModeSelectorProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  disabled?: boolean;
}

const modes: { value: InputMode; icon: typeof Type; label: string }[] = [
  { value: 'text', icon: Type, label: 'Text' },
  { value: 'image', icon: Image, label: 'Image' },
  { value: 'audio', icon: Mic, label: 'Audio' },
];

export function InputModeSelector({ mode, onModeChange, disabled }: InputModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onModeChange(value)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
            mode === value
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
