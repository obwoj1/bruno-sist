import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("/api/health", () => {
  it("returns health info", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("openaiConfigured");
    expect(typeof json.openaiConfigured).toBe("boolean");
    expect(json).toHaveProperty("transcriptionModel");
    expect(json).toHaveProperty("summaryModel");
  });
});
