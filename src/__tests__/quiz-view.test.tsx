import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizView } from "@/components/lesson/QuizView";
import { DEMO_LESSON } from "@/lib/demo-lesson";

vi.mock("@/lib/lesson-store", () => ({
  updateLessonProgress: vi.fn(),
  recordStudySession: vi.fn(),
}));

describe("QuizView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders quiz question and all 4 options", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    expect(screen.getByText(/How long does sensory memory/)).toBeInTheDocument();
    expect(screen.getByText(/Less than 1 second/)).toBeInTheDocument();
    expect(screen.getByText(/About 30 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Up to 5 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/Permanently/)).toBeInTheDocument();
  });

  it("shows progress counter 1/4", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("shows XP counter starting at 0", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    expect(screen.getByText("0 XP")).toBeInTheDocument();
  });

  it("shows segment emoji and title context", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    expect(screen.getByText("👁️")).toBeInTheDocument();
    expect(screen.getByText("Sensory Memory")).toBeInTheDocument();
  });

  it("shows hint after wrong answer", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    // Click wrong answer (index 1 = "About 30 seconds")
    fireEvent.click(screen.getByText(/About 30 seconds/));
    expect(screen.getByText("Hint")).toBeInTheDocument();
    expect(screen.getByText(/camera flash analogy/)).toBeInTheDocument();
  });

  it("shows explanation after correct answer", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    // Click correct answer (index 0)
    fireEvent.click(screen.getByText(/Less than 1 second/));
    expect(screen.getByText(/ultra-brief/)).toBeInTheDocument();
  });

  it("shows continue button after correct answer", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    fireEvent.click(screen.getByText(/Less than 1 second/));
    expect(screen.getByText(/Next Question/)).toBeInTheDocument();
  });

  it("awards XP on correct answer", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    fireEvent.click(screen.getByText(/Less than 1 second/));
    // Should show 10 XP (first quiz reward = 10)
    expect(screen.getByText("10 XP")).toBeInTheDocument();
  });

  it("reduces XP for multiple attempts", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    // Wrong answer first
    fireEvent.click(screen.getByText(/About 30 seconds/));
    // Then correct
    fireEvent.click(screen.getByText(/Less than 1 second/));
    // XP should be 10/2 = 5
    expect(screen.getByText("5 XP")).toBeInTheDocument();
  });

  it("calls updateLessonProgress on correct answer", async () => {
    const { updateLessonProgress } = await import("@/lib/lesson-store");
    render(<QuizView manifest={DEMO_LESSON} />);
    fireEvent.click(screen.getByText(/Less than 1 second/));
    expect(updateLessonProgress).toHaveBeenCalledWith(
      DEMO_LESSON.id,
      "seg-sensory",
      true,
      10
    );
  });

  it("calls recordStudySession on mount", async () => {
    const { recordStudySession } = await import("@/lib/lesson-store");
    render(<QuizView manifest={DEMO_LESSON} />);
    expect(recordStudySession).toHaveBeenCalled();
  });

  it("shows panic button after 2 wrong attempts", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    // First wrong
    fireEvent.click(screen.getByText(/About 30 seconds/));
    expect(screen.queryByText(/Explain It Simpler/)).not.toBeInTheDocument();
    // Second wrong
    fireEvent.click(screen.getByText(/Up to 5 minutes/));
    expect(screen.getByText(/Explain It Simpler/)).toBeInTheDocument();
  });

  it("disables answer buttons after correct answer", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    fireEvent.click(screen.getByText(/Less than 1 second/));
    const buttons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.includes("About 30 seconds")
    );
    expect(buttons[0]).toBeDisabled();
  });

  it("advances to next quiz on continue click", () => {
    render(<QuizView manifest={DEMO_LESSON} />);
    fireEvent.click(screen.getByText(/Less than 1 second/));
    fireEvent.click(screen.getByText(/Next Question/));
    // Should now show second quiz about George Miller
    expect(screen.getByText(/George Miller/)).toBeInTheDocument();
  });

  it("shows completion screen when all quizzes done", () => {
    render(<QuizView manifest={DEMO_LESSON} />);

    // Quiz 1: correct
    fireEvent.click(screen.getByText(/Less than 1 second/));
    fireEvent.click(screen.getByText(/Next Question/));

    // Quiz 2: correct (7 ± 2)
    fireEvent.click(screen.getByText(/7 ± 2/));
    fireEvent.click(screen.getByText(/Next Question/));

    // Quiz 3: correct (Hippocampus)
    fireEvent.click(screen.getByText(/Hippocampus/));
    fireEvent.click(screen.getByText(/Next Question/));

    // Quiz 4: correct (About 50%)
    fireEvent.click(screen.getByText(/About 50%/));
    fireEvent.click(screen.getByText(/Finish/));

    expect(screen.getByText(/All Quizzes Complete/)).toBeInTheDocument();
    expect(screen.getByText(/Try Again/)).toBeInTheDocument();
  });

  it("Try Again resets to first quiz", () => {
    render(<QuizView manifest={DEMO_LESSON} />);

    // Complete all quizzes quickly
    fireEvent.click(screen.getByText(/Less than 1 second/));
    fireEvent.click(screen.getByText(/Next Question/));
    fireEvent.click(screen.getByText(/7 ± 2/));
    fireEvent.click(screen.getByText(/Next Question/));
    fireEvent.click(screen.getByText(/Hippocampus/));
    fireEvent.click(screen.getByText(/Next Question/));
    fireEvent.click(screen.getByText(/About 50%/));
    fireEvent.click(screen.getByText(/Finish/));

    fireEvent.click(screen.getByText(/Try Again/));
    expect(screen.getByText(/How long does sensory memory/)).toBeInTheDocument();
  });

  it("shows 'No quizzes' for manifest without quizzes", () => {
    const noQuizManifest = {
      ...DEMO_LESSON,
      segments: DEMO_LESSON.segments.map((s) => ({ ...s, quiz: undefined })),
    };
    render(<QuizView manifest={noQuizManifest} />);
    expect(screen.getByText(/No quizzes in this lesson/)).toBeInTheDocument();
  });
});
