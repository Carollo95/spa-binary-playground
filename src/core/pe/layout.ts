import type { PeInfo } from "./parser";

export type RegionKind = "dos" | "pe-header" | "optional-header" | "section-table" | "headers-padding" | "section" | "other";

export interface Region {
  name: string;
  kind: RegionKind;
  start: number; // file offset, inclusive
  end: number; // file offset, exclusive
  sectionIndex?: number;
}

/**
 * Splits the whole file into contiguous, non-overlapping regions (headers, each
 * section, and whatever is left over), so every byte belongs to exactly one block.
 */
export function computeRegions(fileSize: number, pe: PeInfo): Region[] {
  const coff = pe.peOffset + 4;
  const opt = coff + 20;
  const sectionTable = opt + pe.sizeOfOptionalHeader;
  const sectionTableEnd = sectionTable + pe.sections.length * 40;

  const candidates: Region[] = [
    { name: "DOS header + stub", kind: "dos", start: 0, end: pe.peOffset },
    { name: "PE signature + COFF header", kind: "pe-header", start: pe.peOffset, end: opt },
    { name: "Optional header", kind: "optional-header", start: opt, end: sectionTable },
    { name: "Section table", kind: "section-table", start: sectionTable, end: sectionTableEnd },
    { name: "Header padding", kind: "headers-padding", start: sectionTableEnd, end: pe.sizeOfHeaders },
    ...pe.sections.map((s, i): Region => ({
      name: `Section ${s.name || "(unnamed)"}`,
      kind: "section",
      start: s.rawOffset,
      end: s.rawOffset + s.rawSize,
      sectionIndex: i,
    })),
  ];

  const sorted = candidates
    .map((r) => ({ ...r, start: Math.max(0, r.start), end: Math.min(fileSize, r.end) }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const regions: Region[] = [];
  let cursor = 0;
  const fillGap = (upTo: number) => {
    if (upTo > cursor) regions.push({ name: "Unmapped / overlay", kind: "other", start: cursor, end: upTo });
  };
  for (const r of sorted) {
    if (r.end <= cursor) continue; // fully overlapped by a previous region
    fillGap(r.start);
    const start = Math.max(r.start, cursor);
    regions.push({ ...r, start });
    cursor = r.end;
  }
  fillGap(fileSize);
  return regions;
}
