import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressDashboard } from "@/components/progression/ProgressDashboard";

vi.mock("@/lib/lesson-store", () => ({
  getTotalStats: vi.fn(() => ({
    totalXP: 150,
    lessonsCompleted: 2,
    studyDays: ["2026-03-25", "2026-03-26"],
    lessonProgress: {
      "lesson-1": { segmentsViewed: ["s1"], quizzesPassed: ["s1"], xpEarned: 50 },
      "lesson-2": { segmentsViewed: ["s1"], quizzesPassed: [], xpEarned: 30, completedAt: Date.now() },
    },
  })),
  getStreak: vi.fn(() => 2),
  getAllLessons: vi.fn(() => [
    { id: "lesson-1", title: "Test 1" },
    { id: "lesson-2", title: "Test 2" },
    { id: "lesson-3", title: "Test 3" },
  ]),
}));

describe("ProgressDashboard Component", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Your Progress' heading", () => {
    render(<ProgressDashboard onClose={onClose} />);
    expect(screen.getByText("Your Progress")).toBeInTheDocument();
  });

  it("shows Total XP stat", () => {
    render(<ProgressDashboard onClose={onClose} />);
    expect(screen.getByText("Total XP")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("shows Study Streak stat", () => {
    render(<ProgressDashboard onClose={onClose} />);
    expect(screen.getByText("Study Streak")).toBeInTheDocument();
    expect(screen.getByText("2 days")).toBeInTheDocument();
  });

  it("shows Lessons Created count", () => {
    render(<ProgressDashboard onClose={onClose} />);
    expect(screen.getByText("Lessons Created")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows Completed lessons count", () => {
    render(<ProgressDashboard onClose={onClose} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
    // Only lesson-2 has completedAt
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("has close button that calls onClose", () => {
    render(<ProgressDashboard onClose={onClose} />);
    const closeBtn = screen.getAllByRole("button").find(
      (b) => b.className.includes("h-7")
    );
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalled();
  });

  it("has backdrop overlay that calls onClose", () => {
    const { container } = render(<ProgressDashboard onClose={onClose} />);
    const backdrop = container.querySelector(".bg-black\\/40");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows encouragement text", () => {
    render(<ProgressDashboard onClose={onClose} />);
    expect(screen.getByText(/Keep studying/)).toBeInTheDocument();
  });
});
