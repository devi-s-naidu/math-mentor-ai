import { useState } from "react";
import { Hand, Check, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HITLRequest } from "@/types/mathMentor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HITLDialogProps {
  request: HITLRequest | null;
  onApprove: (correctedContent?: string) => void;
  onReject: () => void;
}

const typeLabels = {
  'ocr-correction': 'OCR Correction Required',
  'asr-correction': 'Transcription Correction Required',
  'clarification': 'Clarification Needed',
  'verification': 'Solution Verification',
};

export function HITLDialog({ request, onApprove, onReject }: HITLDialogProps) {
  const [editedContent, setEditedContent] = useState(request?.suggestedContent || request?.originalContent || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!request) return null;

  const handleApprove = () => {
    onApprove(isEditing ? editedContent : undefined);
  };

  return (
    <Dialog open={!!request}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
              <Hand className="w-4 h-4 text-warning" />
            </div>
            Human Review Required
          </DialogTitle>
          <DialogDescription>
            {typeLabels[request.type]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-foreground">{request.message}</p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {isEditing ? 'Edit Content' : 'Content'}
            </label>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 border border-border font-mono text-sm">
                {request.suggestedContent || request.originalContent}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            {isEditing ? 'Preview' : 'Edit'}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onReject} className="gap-2">
              <X className="w-4 h-4" />
              Reject
            </Button>
            <Button onClick={handleApprove} className="gap-2">
              <Check className="w-4 h-4" />
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
