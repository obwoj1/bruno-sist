// Minimal markdown-to-HTML for headers and bullet points.
// Not a full markdown parser; used to render AI outputs safely.
export function markedToHtml(md: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  for (const ln of lines) {
    if (/^#\s+/.test(ln)) out.push(`<h2>${esc(ln.replace(/^#\s+/, ""))}</h2>`);
    else if (/^##\s+/.test(ln)) out.push(`<h3>${esc(ln.replace(/^##\s+/, ""))}</h3>`);
    else if (/^\-\s+/.test(ln)) out.push(`<li>${esc(ln.replace(/^\-\s+/, ""))}</li>`);
    else if (!ln.trim()) out.push("");
    else out.push(`<p>${esc(ln)}</p>`);
  }
  // Wrap isolated <li> sequences with <ul>
  const html = out
    .join("\n")
    .replace(/(?:^|\n)((?:<li>[\s\S]*?<\/li>\n?)+)(?=\n|$)/g, (m, grp) => `<ul>\n${grp}\n</ul>`);
  return html;
}
