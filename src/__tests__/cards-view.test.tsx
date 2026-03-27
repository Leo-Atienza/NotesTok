import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CardsView } from "@/components/lesson/CardsView";
import { DEMO_LESSON } from "@/lib/demo-lesson";

describe("CardsView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it("renders first card with emoji and title", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    expect(screen.getByText("👁️")).toBeInTheDocument();
    expect(screen.getByText("Sensory Memory")).toBeInTheDocument();
  });

  it("shows card counter 1 / 4", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("shows segment type badge", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    // The component renders segment.type as-is (lowercase); CSS capitalize handles display
    expect(screen.getByText("concept")).toBeInTheDocument();
  });

  it("shows 'Tap to reveal' prompt", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    expect(screen.getByText("Tap to reveal")).toBeInTheDocument();
  });

  it("has navigation buttons (prev/next/flip)", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    expect(screen.getByText("Flip")).toBeInTheDocument();
    // Should have arrow buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it("previous button is disabled on first card", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    const buttons = screen.getAllByRole("button");
    // First nav button (prev) should be disabled
    const prevBtn = buttons.find((b) => b.getAttribute("disabled") !== null);
    expect(prevBtn).toBeDefined();
  });

  it("shows key terms on card back", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    // Key terms should be rendered (card back is always in DOM, just rotated)
    expect(screen.getByText("sensory memory")).toBeInTheDocument();
    expect(screen.getByText("iconic memory")).toBeInTheDocument();
    expect(screen.getByText("echoic memory")).toBeInTheDocument();
  });

  it("shows content on card back", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    expect(screen.getByText(/bombarded with millions/)).toBeInTheDocument();
  });

  it("shows Super Detail badge when superDetail is true", () => {
    render(<CardsView manifest={DEMO_LESSON} superDetail={true} />);
    expect(screen.getByText("Super Detail")).toBeInTheDocument();
  });

  it("does not show Super Detail badge by default", () => {
    render(<CardsView manifest={DEMO_LESSON} />);
    expect(screen.queryByText("Super Detail")).not.toBeInTheDocument();
  });

  it("shows Scholar badge when scholarMode is true", () => {
    render(<CardsView manifest={DEMO_LESSON} scholarMode={true} />);
    expect(screen.getByText("Scholar")).toBeInTheDocument();
  });

  it("renders progress dots for all segments", () => {
    const { container } = render(<CardsView manifest={DEMO_LESSON} />);
    const dots = container.querySelectorAll(".rounded-full.w-2.h-2");
    expect(dots.length).toBe(4);
  });
});
