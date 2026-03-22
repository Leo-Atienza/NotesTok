"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Loader2, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ProcessingSteps } from "@/components/ui/processing-steps";
import { SAMPLE_NOTES } from "@/lib/sample-notes";
import type { LessonManifest } from "@/lib/types";

interface UploadZoneProps {
  onLessonReady: (manifest: LessonManifest) => void;
}

export function UploadZone({ onLessonReady }: UploadZoneProps) {
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [conceptCount, setConceptCount] = useState(0);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processNotes = useCallback(
    async (formData: FormData) => {
      setIsProcessing(true);
      setError("");
      setCurrentStep(0);
      setConceptCount(0);

      // 30-second timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        // Step 1: Analyze content
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!analyzeRes.ok) {
          const err = await analyzeRes.json();
          throw new Error(err.error || "Failed to analyze notes");
        }

        const analysis = await analyzeRes.json();
        setConceptCount(analysis.concepts.length);
        setCurrentStep(1);

        // Step 2: Generate lesson manifest
        const lessonRes = await fetch("/api/generate-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(analysis),
          signal: controller.signal,
        });

        if (!lessonRes.ok) {
          const err = await lessonRes.json();
          throw new Error(err.error || "Failed to generate lesson");
        }

        setCurrentStep(2);
        const manifest: LessonManifest = await lessonRes.json();
        onLessonReady(manifest);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError(
            "The AI is taking too long. Please try again with shorter notes."
          );
        } else {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
        }
      } finally {
        clearTimeout(timeout);
        setIsProcessing(false);
      }
    },
    [onLessonReady]
  );

  const handleTextSubmit = () => {
    if (text.trim().length < 50) {
      setError("Please enter at least 50 characters of study notes.");
      return;
    }
    const formData = new FormData();
    formData.append("text", text);
    processNotes(formData);
  };

  const handleFileUpload = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    processNotes(formData);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loadSample = () => {
    const sample =
      SAMPLE_NOTES[Math.floor(Math.random() * SAMPLE_NOTES.length)];
    setText(sample.text);
  };

  // Show processing steps overlay when generating
  if (isProcessing) {
    return (
      <Card className="w-full max-w-2xl mx-auto p-8">
        <ProcessingSteps
          currentStep={currentStep}
          conceptCount={conceptCount}
        />
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <Tabs defaultValue="paste">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste">
            <FileText className="w-4 h-4 mr-2" />
            Paste Notes
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-4">
          <Textarea
            placeholder="Paste your study notes here... (biology chapter, lecture notes, textbook excerpt, etc.)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] text-base"
            disabled={isProcessing}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {text.length} characters
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadSample}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Try sample notes
              </Button>
            </div>
            <Button
              onClick={handleTextSubmit}
              disabled={isProcessing || text.trim().length < 50}
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Lesson
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports PDF, TXT, and MD files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              Choose File
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}
    </Card>
  );
}
