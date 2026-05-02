import { describe, it, expect } from "vitest";
import { markedToHtml } from "@/lib/markdown";

describe("markedToHtml", () => {
  it("renders headers and bullets", () => {
    const md = `# Title\n\n- one\n- two`;
    const html = markedToHtml(md);
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>two</li>");
    expect(html).toContain("<ul>");
  });

  it("escapes HTML", () => {
    const md = `<script>alert(1)</script>`;
    const html = markedToHtml(md);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
