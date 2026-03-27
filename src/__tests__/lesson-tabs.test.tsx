import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonTabs } from "@/components/lesson/LessonTabs";
import { DEMO_LESSON } from "@/lib/demo-lesson";
import type { LessonManifest } from "@/lib/types";

// Mock child components to isolate LessonTabs testing
vi.mock("@/components/lesson/VideosView", () => ({
  VideosView: () => <div data-testid="videos-view">Videos</div>,
}));
vi.mock("@/components/lesson/CardsView", () => ({
  CardsView: ({ superDetail, scholarMode }: { superDetail?: boolean; scholarMode?: boolean }) => (
    <div data-testid="cards-view" data-super-detail={superDetail} data-scholar={scholarMode}>Cards</div>
  ),
}));
vi.mock("@/components/lesson/QuizView", () => ({
  QuizView: () => <div data-testid="quiz-view">Quiz</div>,
}));
vi.mock("@/components/lesson/ListenView", () => ({
  ListenView: ({ scholarMode }: { scholarMode?: boolean }) => (
    <div data-testid="listen-view" data-scholar={scholarMode}>Listen</div>
  ),
}));
vi.mock("@/components/buddy/BuddyChatDrawer", () => ({
  BuddyChatDrawer: () => <div data-testid="buddy-drawer">Buddy</div>,
}));
vi.mock("@/components/locked-in/LockedInMode", () => ({
  LockedInMode: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="locked-in"><button onClick={onClose}>Close LockedIn</button></div>
  ),
}));
vi.mock("@/components/progression/ProgressDashboard", () => ({
  ProgressDashboard: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="progress-dash"><button onClick={onClose}>Close Progress</button></div>
  ),
}));

describe("LessonTabs Component", () => {
  const onBack = vi.fn();

  it("renders lesson title", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    expect(screen.getByText("How Memory Works")).toBeInTheDocument();
  });

  it("shows segment count", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    expect(screen.getByText(/4 segments/)).toBeInTheDocument();
  });

  it("shows total XP badge", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    expect(screen.getByText(/65 XP/)).toBeInTheDocument();
  });

  it("renders all 4 tab triggers", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    // Tab triggers contain icon + label; use regex to match partial text
    expect(screen.getByRole("tab", { name: /Videos/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Quiz/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Cards/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Listen/ })).toBeInTheDocument();
  });

  it("has Detail toggle button", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    expect(screen.getByText("Detail")).toBeInTheDocument();
  });

  it("has Scholar toggle button", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    expect(screen.getByText("Scholar")).toBeInTheDocument();
  });

  it("has Focus button", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    expect(screen.getByText("Focus")).toBeInTheDocument();
  });

  it("has Progress button", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    expect(screen.getByTitle("View progress")).toBeInTheDocument();
  });

  it("has buddy chat floating button", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    expect(screen.getByTitle("Ask your study buddy")).toBeInTheDocument();
  });

  it("calls onBack when back arrow is clicked", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    const backBtn = screen.getAllByRole("button")[0];
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });

  it("opens LockedInMode when Focus is clicked", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    fireEvent.click(screen.getByText("Focus"));
    expect(screen.getByTestId("locked-in")).toBeInTheDocument();
  });

  it("opens ProgressDashboard when progress button is clicked", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    fireEvent.click(screen.getByTitle("View progress"));
    expect(screen.getByTestId("progress-dash")).toBeInTheDocument();
  });

  it("opens BuddyChatDrawer when chat button is clicked", () => {
    render(<LessonTabs manifest={DEMO_LESSON} onBack={onBack} />);
    fireEvent.click(screen.getByTitle("Ask your study buddy"));
    expect(screen.getByTestId("buddy-drawer")).toBeInTheDocument();
  });

  it("defaults to Videos tab for focus-seeker profile", () => {
    const manifest: LessonManifest = { ...DEMO_LESSON, learnerProfile: "focus-seeker" };
    render(<LessonTabs manifest={manifest} onBack={onBack} />);
    expect(screen.getByTestId("videos-view")).toBeInTheDocument();
  });

  it("defaults to Listen tab for multi-modal profile", () => {
    const manifest: LessonManifest = { ...DEMO_LESSON, learnerProfile: "multi-modal" };
    render(<LessonTabs manifest={manifest} onBack={onBack} />);
    // multi-modal defaults to "listen" tab
    expect(screen.getByTestId("listen-view")).toBeInTheDocument();
  });

  it("defaults to Cards tab for global-scholar profile", () => {
    const manifest: LessonManifest = { ...DEMO_LESSON, learnerProfile: "global-scholar" };
    render(<LessonTabs manifest={manifest} onBack={onBack} />);
    expect(screen.getByTestId("cards-view")).toBeInTheDocument();
  });

  it("auto-enables scholar mode for global-scholar profile", () => {
    const manifest: LessonManifest = { ...DEMO_LESSON, learnerProfile: "global-scholar" };
    render(<LessonTabs manifest={manifest} onBack={onBack} />);
    const cardsView = screen.getByTestId("cards-view");
    expect(cardsView.getAttribute("data-scholar")).toBe("true");
  });
});
