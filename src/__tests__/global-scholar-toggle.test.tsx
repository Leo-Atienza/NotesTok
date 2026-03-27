import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlobalScholarToggle } from "@/components/scholar/GlobalScholarToggle";

describe("GlobalScholarToggle Component", () => {
  it("renders Scholar label", () => {
    render(<GlobalScholarToggle enabled={false} onToggle={vi.fn()} />);
    expect(screen.getByText("Scholar")).toBeInTheDocument();
  });

  it("shows ON badge when enabled", () => {
    render(<GlobalScholarToggle enabled={true} onToggle={vi.fn()} />);
    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("does not show ON badge when disabled", () => {
    render(<GlobalScholarToggle enabled={false} onToggle={vi.fn()} />);
    expect(screen.queryByText("ON")).not.toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<GlobalScholarToggle enabled={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByText("Scholar"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("has blue styling when enabled", () => {
    const { container } = render(
      <GlobalScholarToggle enabled={true} onToggle={vi.fn()} />
    );
    const button = container.querySelector("button");
    expect(button?.className).toContain("text-blue-600");
  });

  it("has muted styling when disabled", () => {
    const { container } = render(
      <GlobalScholarToggle enabled={false} onToggle={vi.fn()} />
    );
    const button = container.querySelector("button");
    expect(button?.className).toContain("text-muted-foreground");
  });
});
