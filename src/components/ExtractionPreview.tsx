import { useState } from "react";
import { Edit2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ExtractionPreviewProps {
  extractedText: string;
  confidence?: number;
  onConfirm: (text: string) => void;
  onReject: () => void;
  type: 'ocr' | 'asr';
}

export function ExtractionPreview({
  extractedText,
  confidence = 0.85,
  onConfirm,
  onReject,
  type,
}: ExtractionPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(extractedText);

  const isLowConfidence = confidence < 0.7;

  const handleConfirm = () => {
    onConfirm(editedText);
  };

  return (
    <div className={cn(
      "rounded-xl border bg-card overflow-hidden",
      isLowConfidence ? "border-warning" : "border-border"
    )}>
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">
            {type === 'ocr' ? 'OCR Result' : 'Transcription'}
          </h3>
          {isLowConfidence && (
            <div className="flex items-center gap-1 text-warning text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low confidence - please review</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            confidence >= 0.8 ? "bg-success/20 text-success" :
            confidence >= 0.6 ? "bg-warning/20 text-warning" :
            "bg-destructive/20 text-destructive"
          )}>
            {Math.round(confidence * 100)}% confidence
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isEditing ? (
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[120px] font-mono text-sm"
            placeholder="Edit the extracted text..."
          />
        ) : (
          <div className="p-4 rounded-lg bg-muted/50 border border-border font-mono text-sm whitespace-pre-wrap">
            {editedText || extractedText}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? "Preview" : "Edit"}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Confirm & Solve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
