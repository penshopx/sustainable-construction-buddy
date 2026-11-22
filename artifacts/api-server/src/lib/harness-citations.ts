type Pair =
  | { id: string; page: number }
  | { id: string; lineStart: number; lineEnd: number };

/** Only excerpts that survived the shared knowledge context budget can be cited. */
export function knowledgeCitationPairs(context: string): Pair[] {
  const start = context.indexOf("KUTIPAN_DATA_TIDAK_TEPERCAYA=");
  const end = context.lastIndexOf("\nAKHIR_DATA_RUJUKAN");
  if (start < 0 || end < start) throw new Error("Missing shared knowledge evidence packet");
  const packet: unknown = JSON.parse(context.slice("KUTIPAN_DATA_TIDAK_TEPERCAYA=".length + start, end));
  if (!Array.isArray(packet)) throw new Error("Invalid shared knowledge evidence packet");
  const refs = new Map<string, Pair>();
  for (const value of packet) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    if (typeof item.id !== "string" || !/^KB\d+$/.test(item.id) ||
        typeof item.text !== "string" || !item.text.trim()) continue;
    if (Number.isInteger(item.page) && Number(item.page) > 0) {
      refs.set(`${item.id}:page:${item.page}`, { id: item.id, page: Number(item.page) });
    } else if (item.page === null && Number.isInteger(item.lineStart) && Number(item.lineStart) > 0 &&
        Number.isInteger(item.lineEnd) && Number(item.lineEnd) >= Number(item.lineStart)) {
      refs.set(`${item.id}:line:${item.lineStart}:${item.lineEnd}`, {
        id: item.id, lineStart: Number(item.lineStart), lineEnd: Number(item.lineEnd),
      });
    }
  }
  return [...refs.values()];
}

/** Only mapping metadata and excerpts actually included in this request count. */
export function schemeCitationPairs(context: string): Pair[] {
  const start = context.indexOf("DATA_SKEMA_TIDAK_TEPERCAYA=");
  const end = context.lastIndexOf("\nAKHIR_DATA_SKEMA");
  if (start < 0 || end < start) throw new Error("Missing scheme evidence packet");
  const packet = JSON.parse(context.slice(start + "DATA_SKEMA_TIDAK_TEPERCAYA=".length, end));
  const refs = new Map<string, Pair>();
  const add = (item: Record<string, unknown>) => {
    const id = item.id;
    if (typeof id === "string" && /^KB\d+$/.test(id) && Number.isInteger(item.page) && Number(item.page) > 0)
      refs.set(`${id}:${item.page}`, { id, page: Number(item.page) });
  };
  if (packet.mappingReference) add(packet.mappingReference);
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const item = value as Record<string, unknown>;
    if ((typeof item.excerpt === "string" && item.excerpt.trim()) ||
        (typeof item.text === "string" && item.text.trim())) add(item);
    Object.values(item).forEach(walk);
  };
  // Section-start metadata can also contain id/page/text. A title is not
  // substantive evidence; only walk explicitly designated excerpt fields.
  walk([
    packet.subclassificationScope?.references,
    packet.kbli2025?.references,
    packet.additionalSchemeExcerpts,
  ]);
  if (!refs.size) throw new Error("No scheme evidence in context");
  return [...refs.values()];
}

/** Verifies identifiers/pages, not semantic support for every AI statement. */
export function checkCitationLinks(answer: string, allowed: Pair[]): number {
  const markers = answer.match(/\[KB\d+[^\]]*\]/gi) ?? [];
  for (const marker of markers) {
    const pageMatch = /^\[(KB\d+),\s*(?:halaman PDF|hlm\.)\s*(\d+)\]$/i.exec(marker);
    if (pageMatch) {
      if (!allowed.some(ref => "page" in ref && ref.id === pageMatch[1]!.toUpperCase() && ref.page === Number(pageMatch[2])))
        throw new Error("Unlisted source/page");
      continue;
    }
    const lineMatch = /^\[(KB\d+),\s*baris\s*(\d+)(?:\s*[-–]\s*(\d+))?\]$/i.exec(marker);
    if (!lineMatch) throw new Error("Invalid citation format");
    const id = lineMatch[1]!.toUpperCase();
    const lineStart = Number(lineMatch[2]);
    const lineEnd = Number(lineMatch[3] ?? lineMatch[2]);
    // A line range is valid only when every referenced original line was sent.
    if (lineEnd < lineStart || lineEnd - lineStart > 100 ||
        Array.from({ length: lineEnd - lineStart + 1 }, (_, index) => lineStart + index)
          .some(line => !allowed.some(ref => "lineStart" in ref &&
            ref.id === id && line >= ref.lineStart && line <= ref.lineEnd))) {
      throw new Error("Unlisted source/line");
    }
  }
  return markers.length;
}
