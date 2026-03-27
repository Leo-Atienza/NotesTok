import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListenView } from "@/components/lesson/ListenView";
import { DEMO_LESSON } from "@/lib/demo-lesson";

vi.mock("@/lib/lesson-store", () => ({
  updateLessonProgress: vi.fn(),
  recordStudySession: vi.fn(),
}));

describe("ListenView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders first segment emoji and title", () => {
    render(<ListenView manifest={DEMO_LESSON} />);
    // The emoji appears in both the album art and the segment list, so use getAllByText
    expect(screen.getAllByText("👁️").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Sensory Memory").length).toBeGreaterThanOrEqual(1);
  });

  it("shows segment counter", () => {
    render(<ListenView manifest={DEMO_LESSON} />);
    expect(screen.getByText(/Segment 1 of 4/)).toBeInTheDocument();
  });

  it("shows key terms for current segment", () => {
    render(<ListenView manifest={DEMO_LESSON} />);
    expect(screen.getByText("sensory memory")).toBeInTheDocument();
    expect(screen.getByText("iconic memory")).toBeInTheDocument();
  });

  it("shows segment content text", () => {
    render(<ListenView manifest={DEMO_LESSON} />);
    expect(screen.getByText(/bombarded with millions/)).toBeInTheDocument();
  });

  it("has play/pause, skip forward, skip back controls", () => {
    render(<ListenView manifest={DEMO_LESSON} />);
    const buttons = screen.getAllByRole("button");
    // Should have at least: prev, play, next + segment list items
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("shows 'Web Speech' engine indicator", () => {
    render(<ListenView manifest={DEMO_LESSON} />);
    expect(screen.getByText("Web Speech")).toBeInTheDocument();
  });

  it("shows all segments in the list", () => {
    render(<ListenView manifest={DEMO_LESSON} />);
    expect(screen.getByText("Short-Term Memory")).toBeInTheDocument();
    expect(screen.getByText("Long-Term Memory")).toBeInTheDocument();
    expect(screen.getByText("Retrieval & Forgetting")).toBeInTheDocument();
  });

  it("highlights current segment in segment list", () => {
    const { container } = render(<ListenView manifest={DEMO_LESSON} />);
    // Find the active segment list item by its class containing bg-primary
    const allSegmentButtons = container.querySelectorAll("button.w-full");
    const activeItem = Array.from(allSegmentButtons).find((el) =>
      el.className.includes("bg-primary")
    );
    expect(activeItem).toBeDefined();
    expect(activeItem!.textContent).toContain("Sensory Memory");
  });

  it("calls recordStudySession on mount", async () => {
    const { recordStudySession } = await import("@/lib/lesson-store");
    render(<ListenView manifest={DEMO_LESSON} />);
    expect(recordStudySession).toHaveBeenCalled();
  });

  it("calls updateLessonProgress on mount for first segment", async () => {
    const { updateLessonProgress } = await import("@/lib/lesson-store");
    render(<ListenView manifest={DEMO_LESSON} />);
    expect(updateLessonProgress).toHaveBeenCalledWith(
      DEMO_LESSON.id,
      "seg-sensory"
    );
  });

  it("disables skip back on first segment", () => {
    render(<ListenView manifest={DEMO_LESSON} />);
    const buttons = screen.getAllByRole("button");
    // First transport button (skip back) should be disabled
    const skipBack = buttons.find(
      (b) => b.className.includes("h-12") && b.hasAttribute("disabled")
    );
    expect(skipBack).toBeDefined();
  });
});
