import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideosView } from "@/components/lesson/VideosView";
import { DEMO_LESSON } from "@/lib/demo-lesson";

vi.mock("@/lib/lesson-store", () => ({
  getLessonImages: vi.fn(() => null),
  saveLessonImages: vi.fn(),
  updateLessonProgress: vi.fn(),
  recordStudySession: vi.fn(),
}));

vi.mock("@/lib/demo-images", () => ({
  getDemoImages: vi.fn(() => ({
    "seg-sensory": ["data:image/png;base64,demo1"],
    "seg-short-term": ["data:image/png;base64,demo2"],
  })),
}));

// Mock VideoPlayer to avoid Remotion complexity in tests
vi.mock("@/components/video/VideoPlayer", () => ({
  VideoPlayer: ({ mode, segment }: { mode: string; segment: { title: string } }) => (
    <div data-testid="video-player" data-mode={mode}>
      Playing: {segment.title}
    </div>
  ),
}));

describe("VideosView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ segmentMedia: {}, voiceovers: {} }),
    });
  });

  it("renders mode selector with Brainrot and Fireship", () => {
    render(<VideosView manifest={DEMO_LESSON} />);
    expect(screen.getByText("Brainrot")).toBeInTheDocument();
    expect(screen.getByText("Fireship")).toBeInTheDocument();
  });

  it("renders segment navigation buttons", () => {
    render(<VideosView manifest={DEMO_LESSON} />);
    // Each nav button renders "{emoji} {title}" — use getAllByText for titles that appear multiple times
    expect(screen.getAllByText(/Sensory Memory/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Short-Term Memory/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Long-Term Memory/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Retrieval & Forgetting/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders video player component", () => {
    render(<VideosView manifest={DEMO_LESSON} />);
    expect(screen.getByTestId("video-player")).toBeInTheDocument();
  });

  it("shows segment counter", () => {
    render(<VideosView manifest={DEMO_LESSON} />);
    expect(screen.getByText(/1 of 4/)).toBeInTheDocument();
  });

  it("calls recordStudySession on mount", async () => {
    const { recordStudySession } = await import("@/lib/lesson-store");
    render(<VideosView manifest={DEMO_LESSON} />);
    expect(recordStudySession).toHaveBeenCalled();
  });

  it("calls updateLessonProgress on mount for first segment", async () => {
    const { updateLessonProgress } = await import("@/lib/lesson-store");
    render(<VideosView manifest={DEMO_LESSON} />);
    expect(updateLessonProgress).toHaveBeenCalledWith(
      DEMO_LESSON.id,
      "seg-sensory"
    );
  });

  it("defaults to brainrot mode", () => {
    render(<VideosView manifest={DEMO_LESSON} />);
    const player = screen.getByTestId("video-player");
    expect(player.getAttribute("data-mode")).toBe("brainrot");
  });

  it("shows current segment title below player", () => {
    render(<VideosView manifest={DEMO_LESSON} />);
    // The segment info area
    expect(screen.getByText("Sensory Memory")).toBeInTheDocument();
  });
});
