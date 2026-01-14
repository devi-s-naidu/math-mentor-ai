import { Header } from "@/components/Header";
import { InputModeSelector } from "@/components/InputModeSelector";
import { TextInput } from "@/components/TextInput";
import { ImageInput } from "@/components/ImageInput";
import { AudioInput } from "@/components/AudioInput";
import { AgentTrace } from "@/components/AgentTrace";
import { ExtractionPreview } from "@/components/ExtractionPreview";
import { SolutionDisplay } from "@/components/SolutionDisplay";
import { HITLDialog } from "@/components/HITLDialog";
import { MemoryPanel } from "@/components/MemoryPanel";
import { useMathMentor } from "@/hooks/useMathMentor";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";

const Index = () => {
  const {
    state,
    setInputMode,
    solveProblem,
    processImage,
    processAudio,
    confirmExtraction,
    rejectExtraction,
    handleHITLApprove,
    handleHITLReject,
    handleFeedback,
    selectMemoryEntry,
    clearMemory,
    reset,
  } = useMathMentor();

  const showExtractionPreview =
    state.extractedText && !state.solution && !state.isProcessing;

  const showSolution = state.solution && !state.isProcessing;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl pointer-events-none" />

      <main className="container mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Input Section */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Enter Your Math Problem
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Type, upload an image, or record audio
                  </p>
                </div>
                {(state.solution || state.extractedText) && (
                  <Button variant="outline" size="sm" onClick={reset} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    New Problem
                  </Button>
                )}
              </div>

              <InputModeSelector
                mode={state.inputMode}
                onModeChange={setInputMode}
                disabled={state.isProcessing}
              />

              {!showExtractionPreview && !showSolution && (
                <>
                  {state.inputMode === "text" && (
                    <TextInput
                      onSubmit={solveProblem}
                      disabled={state.isProcessing}
                    />
                  )}
                  {state.inputMode === "image" && (
                    <ImageInput
                      onSubmit={processImage}
                      disabled={state.isProcessing}
                    />
                  )}
                  {state.inputMode === "audio" && (
                    <AudioInput
                      onSubmit={processAudio}
                      disabled={state.isProcessing}
                    />
                  )}
                </>
              )}

              {showExtractionPreview && (
                <ExtractionPreview
                  extractedText={state.extractedText}
                  confidence={0.87}
                  onConfirm={confirmExtraction}
                  onReject={rejectExtraction}
                  type={state.inputMode === "image" ? "ocr" : "asr"}
                />
              )}
            </div>

            {/* Processing indicator */}
            {state.isProcessing && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Processing your problem...</p>
                  <p className="text-sm text-muted-foreground">
                    Our AI agents are working on it
                  </p>
                </div>
              </div>
            )}

            {/* Solution */}
            {showSolution && (
              <SolutionDisplay
                solution={state.solution}
                onFeedback={handleFeedback}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Agent Trace */}
            <AgentTrace agents={state.agents} />

            {/* Memory Panel */}
            <div className="h-[400px]">
              <MemoryPanel
                entries={state.memory}
                onSelectEntry={selectMemoryEntry}
                onClearMemory={clearMemory}
              />
            </div>
          </div>
        </div>
      </main>

      {/* HITL Dialog */}
      <HITLDialog
        request={state.hitlRequest}
        onApprove={handleHITLApprove}
        onReject={handleHITLReject}
      />
    </div>
  );
};

export default Index;
