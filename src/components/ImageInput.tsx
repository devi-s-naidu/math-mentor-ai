import { useState, useCallback } from "react";
import { Upload, X, FileImage, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageInputProps {
  onSubmit: (file: File) => void;
  disabled?: boolean;
}

export function ImageInput({ onSubmit, disabled }: ImageInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type.startsWith("image/")) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setFile(null);
  };

  const handleSubmit = () => {
    if (file) {
      onSubmit(file);
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 text-center",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Drop your math problem image here</p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse • JPG, PNG supported
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileImage className="w-4 h-4" />
                <span>Screenshot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>Photo</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border bg-card">
          <img
            src={preview}
            alt="Uploaded math problem"
            className="w-full max-h-[300px] object-contain bg-muted/30"
          />
          <button
            onClick={clearImage}
            disabled={disabled}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-destructive text-foreground hover:text-destructive-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="p-4 border-t border-border">
            <Button onClick={handleSubmit} disabled={disabled} className="w-full gap-2">
              <FileImage className="w-4 h-4" />
              Process Image with OCR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
