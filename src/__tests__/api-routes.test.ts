import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the gemini module before importing routes
vi.mock("@/lib/gemini", () => ({
  getAI: vi.fn(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: '{"test": true}',
      }),
    },
  })),
  MODEL: "gemini-2.0-flash",
  withRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock("@/lib/prompts", () => ({
  CONTENT_ANALYSIS_PROMPT: "test prompt",
  MANIFEST_GENERATION_PROMPT: "test prompt",
  GLOBAL_SCHOLAR_PROMPT: "test {keyTerms} {text}",
  PANIC_REGENERATION_PROMPT: "test {original} {concept}",
  BUDDY_PERSONALITY_PROMPT: "test prompt",
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API Route — /api/super-detail", () => {
  it("returns 400 when content is missing", async () => {
    const { POST } = await import("@/app/api/super-detail/route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns detailed content on valid request", async () => {
    const { getAI } = await import("@/lib/gemini");
    (getAI as ReturnType<typeof vi.fn>).mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: "Detailed breakdown here",
        }),
      },
    });

    const { POST } = await import("@/app/api/super-detail/route");
    const res = await POST(makeRequest({ content: "Some content", title: "Topic" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.detailed).toBeTruthy();
  });

  it("returns 400 for non-string content", async () => {
    const { POST } = await import("@/app/api/super-detail/route");
    const res = await POST(makeRequest({ content: 123 }));
    expect(res.status).toBe(400);
  });
});

describe("API Route — /api/simplify", () => {
  it("returns 400 when content is missing", async () => {
    const { POST } = await import("@/app/api/simplify/route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns simplified content on valid request", async () => {
    const { getAI } = await import("@/lib/gemini");
    (getAI as ReturnType<typeof vi.fn>).mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: "Simplified content",
        }),
      },
    });

    const { POST } = await import("@/app/api/simplify/route");
    const res = await POST(
      makeRequest({ content: "Complex text", keyTerms: ["term1"] })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.simplifiedContent).toBeTruthy();
  });
});

describe("API Route — /api/panic", () => {
  it("returns 400 when original or concept is missing", async () => {
    const { POST } = await import("@/app/api/panic/route");
    const res = await POST(makeRequest({ original: "text" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when both fields are missing", async () => {
    const { POST } = await import("@/app/api/panic/route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns simpler explanation on valid request", async () => {
    const { getAI } = await import("@/lib/gemini");
    (getAI as ReturnType<typeof vi.fn>).mockReturnValue({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: "Simpler explanation here",
        }),
      },
    });

    const { POST } = await import("@/app/api/panic/route");
    const res = await POST(
      makeRequest({ original: "Complex explanation", concept: "Memory" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.simplerExplanation).toBeTruthy();
  });
});

describe("API Route — /api/analyze", () => {
  it("returns 400 when notes are missing", async () => {
    const { POST } = await import("@/app/api/analyze/route");
    // The analyze route expects formData, not JSON
    const formData = new FormData();
    formData.append("text", "");
    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("API Route — /api/generate-lesson", () => {
  it("returns 400 when analysis is missing", async () => {
    const { POST } = await import("@/app/api/generate-lesson/route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});

describe("API Route — /api/buddy", () => {
  it("returns 400 when message is missing", async () => {
    const { POST } = await import("@/app/api/buddy/route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});
