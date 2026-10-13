import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import { ThemeProvider } from "@/components/ThemeProvider";

vi.mock("@/components/home/WebberickMascot", () => ({
  WebberickMascot: () => <div data-testid="mascot" />,
}));
vi.mock("@/components/AdminEntryAnimation", () => ({
  AdminEntryAnimation: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>Finish admin entry animation</button>
  ),
}));

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

describe("redesigned homepage admin entry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves the three-click brand entry to /admin/login", () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.scrollTo = vi.fn();

    render(
      <ThemeProvider><MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<div>Admin login route</div>} />
        </Routes>
      </MemoryRouter></ThemeProvider>,
    );

    const logo = screen.getByRole("link", { name: "Webberick home" });
    fireEvent.click(logo);
    fireEvent.click(logo);
    expect(screen.queryByRole("button", { name: "Finish admin entry animation" })).not.toBeInTheDocument();
    fireEvent.click(logo);
    fireEvent.click(screen.getByRole("button", { name: "Finish admin entry animation" }));
    expect(screen.getByText("Admin login route")).toBeInTheDocument();
  });
});
