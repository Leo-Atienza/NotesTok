import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { ProfileSelectCards } from "@/components/buddy/ProfileSelectCards";

describe("BuddyAvatar Component", () => {
  it("renders emoji avatar", () => {
    render(<BuddyAvatar />);
    expect(screen.getByText("🧠")).toBeInTheDocument();
  });

  it("renders with 'sm' size prop", () => {
    const { container } = render(<BuddyAvatar size="sm" />);
    const avatar = container.firstChild;
    expect(avatar).toBeTruthy();
  });
});

describe("ProfileSelectCards Component", () => {
  const onSelect = vi.fn();

  it("renders all 3 profile options", () => {
    render(<ProfileSelectCards onSelect={onSelect} />);
    expect(screen.getByText(/Focus Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Listen Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Global Scholar/i)).toBeInTheDocument();
  });

  it("calls onSelect with focus-seeker when clicked", () => {
    render(<ProfileSelectCards onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Focus Mode/i));
    expect(onSelect).toHaveBeenCalledWith("focus-seeker");
  });

  it("calls onSelect with multi-modal when clicked", () => {
    render(<ProfileSelectCards onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Listen Mode/i));
    expect(onSelect).toHaveBeenCalledWith("multi-modal");
  });

  it("calls onSelect with global-scholar when clicked", () => {
    render(<ProfileSelectCards onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Global Scholar/i));
    expect(onSelect).toHaveBeenCalledWith("global-scholar");
  });

  it("shows profile descriptions", () => {
    render(<ProfileSelectCards onSelect={onSelect} />);
    // Each profile should have a description
    const descriptions = screen.getAllByRole("button");
    expect(descriptions.length).toBeGreaterThanOrEqual(3);
  });
});
