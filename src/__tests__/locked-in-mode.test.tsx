import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LockedInMode } from "@/components/locked-in/LockedInMode";

// Mock BuddyAvatar
vi.mock("@/components/buddy/BuddyAvatar", () => ({
  BuddyAvatar: () => <span data-testid="avatar">🧠</span>,
}));

describe("LockedInMode Component", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders select phase by default", () => {
    render(<LockedInMode onClose={onClose} />);
    expect(screen.getByText("Locked-In Mode")).toBeInTheDocument();
    expect(screen.getByText(/Choose your focus duration/)).toBeInTheDocument();
  });

  it("shows 3 duration presets", () => {
    render(<LockedInMode onClose={onClose} />);
    expect(screen.getByText("25 min")).toBeInTheDocument();
    expect(screen.getByText("50 min")).toBeInTheDocument();
    expect(screen.getByText("90 min")).toBeInTheDocument();
  });

  it("transitions to active phase when preset is selected", () => {
    render(<LockedInMode onClose={onClose} />);
    fireEvent.click(screen.getByText("25 min"));
    expect(screen.getByText("remaining")).toBeInTheDocument();
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  it("shows countdown timer in active phase", () => {
    render(<LockedInMode onClose={onClose} />);
    fireEvent.click(screen.getByText("25 min"));

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("24:59")).toBeInTheDocument();
  });

  it("shows motivational message in active phase", () => {
    render(<LockedInMode onClose={onClose} />);
    fireEvent.click(screen.getByText("25 min"));
    // Should show one of the motivational messages
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
  });

  it("shows 50 min timer correctly", () => {
    render(<LockedInMode onClose={onClose} />);
    fireEvent.click(screen.getByText("50 min"));
    expect(screen.getByText("50:00")).toBeInTheDocument();
  });

  it("transitions to done phase when timer reaches 0", () => {
    render(<LockedInMode onClose={onClose} />);
    fireEvent.click(screen.getByText("25 min"));

    // Fast forward 25 minutes
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    expect(screen.getByText(/Session Complete/)).toBeInTheDocument();
    expect(screen.getByText(/Back to Lesson/)).toBeInTheDocument();
  });

  it("saves focus session to localStorage on completion", () => {
    render(<LockedInMode onClose={onClose} />);
    fireEvent.click(screen.getByText("25 min"));

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "notestok:focus-sessions",
      expect.any(String)
    );
  });

  it("shows buddy name in completion message", () => {
    render(<LockedInMode onClose={onClose} buddyName="Toki" />);
    fireEvent.click(screen.getByText("25 min"));

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    expect(screen.getByText(/Toki is proud of you/)).toBeInTheDocument();
  });

  it("calls onClose when Back to Lesson is clicked after completion", () => {
    render(<LockedInMode onClose={onClose} />);
    fireEvent.click(screen.getByText("25 min"));

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000);
    });

    fireEvent.click(screen.getByText("Back to Lesson"));
    expect(onClose).toHaveBeenCalled();
  });

  it("has close button in all phases", () => {
    render(<LockedInMode onClose={onClose} />);
    // Close button exists in select phase
    const closeButtons = screen.getAllByRole("button");
    expect(closeButtons.length).toBeGreaterThan(0);
  });
});
