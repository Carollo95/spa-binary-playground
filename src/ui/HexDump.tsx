import { useMemo } from "react";
import { computeRegions, type Region } from "../core/pe/layout";
import type { PeInfo } from "../core/pe/parser";
import "./hexdump.css";

const BYTES_PER_ROW = 16;
const hex2 = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
const hex = (n: number) => "0x" + n.toString(16);

const FIXED_HUES: Record<string, number> = {
  dos: 210,
  "pe-header": 275,
  "optional-header": 320,
  "section-table": 25,
  "headers-padding": 0,
};

function regionColor(r: Region, sectionCount: number): string {
  if (r.kind === "other") return "hsla(0, 0%, 50%, 0.25)";
  if (r.kind === "headers-padding") return "hsla(0, 0%, 50%, 0.15)";
  const hue =
    r.kind === "section" ? 60 + ((r.sectionIndex ?? 0) * 300) / Math.max(sectionCount, 1) : (FIXED_HUES[r.kind] ?? 0);
  return `hsla(${Math.round(hue)}, 70%, 50%, 0.35)`;
}

/** Hex text of bytes, with a newline after every byte at the end of a 16-byte row. */
function regionText(bytes: Uint8Array, r: Region): string {
  const parts: string[] = [];
  for (let i = r.start; i < r.end; i++) {
    parts.push(hex2[bytes[i] ?? 0] ?? "00", i % BYTES_PER_ROW === BYTES_PER_ROW - 1 || i === bytes.length - 1 ? "\n" : " ");
  }
  return parts.join("");
}

function offsetGutter(length: number): string {
  const rows = Math.ceil(length / BYTES_PER_ROW);
  const width = Math.max(8, (length - 1).toString(16).length);
  const lines: string[] = [];
  for (let i = 0; i < rows; i++) lines.push((i * BYTES_PER_ROW).toString(16).padStart(width, "0"));
  return lines.join("\n");
}

interface Props {
  bytes: Uint8Array;
  pe: PeInfo;
}

export function HexDump({ bytes, pe }: Props) {
  const regions = useMemo(() => computeRegions(bytes.length, pe), [bytes, pe]);
  const sectionCount = pe.sections.length;
  const body = useMemo(
    () =>
      regions.map((r) => (
        <span
          key={r.start}
          className="hex-region"
          style={{ background: regionColor(r, sectionCount) }}
          title={`${r.name} (${hex(r.start)} – ${hex(r.end)}, ${r.end - r.start} bytes)`}
        >
          {regionText(bytes, r)}
        </span>
      )),
    [bytes, regions, sectionCount],
  );
  const gutter = useMemo(() => offsetGutter(bytes.length), [bytes]);

  return (
    <section>
      <h2>Hex dump</h2>
      <ul className="hex-legend">
        {regions.map((r) => (
          <li key={r.start}>
            <span className="hex-swatch" style={{ background: regionColor(r, sectionCount) }} />
            {r.name}{" "}
            <small>
              {hex(r.start)}–{hex(r.end)}
            </small>
          </li>
        ))}
      </ul>
      <div className="hex-dump">
        <pre className="hex-gutter">{gutter}</pre>
        <pre className="hex-body">{body}</pre>
      </div>
    </section>
  );
}
