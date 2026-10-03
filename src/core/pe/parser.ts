export interface Section {
  name: string;
  virtualSize: number;
  virtualAddress: number; // RVA
  rawSize: number;
  rawOffset: number;
  characteristics: number;
}

export interface PeInfo {
  machine: number;
  isPe32Plus: boolean;
  entryPointRva: number;
  imageBase: bigint;
  sizeOfImage: number;
  peOffset: number; // file offset of the 'PE\0\0' signature (e_lfanew)
  sizeOfOptionalHeader: number;
  sizeOfHeaders: number;
  sections: Section[];
}

export const MACHINE_AMD64 = 0x8664;

export class PeError extends Error {}

export function parsePe(buffer: ArrayBuffer): PeInfo {
  const view = new DataView(buffer);
  const checkLength = (offset: number, length: number, name: string) => {
    if (offset < 0 || offset + length > view.byteLength) {
      throw new PeError(`File truncated while reading ${name}`);
    }
  };

  checkLength(0, 0x40, "DOS header");
  if (view.getUint16(0, true) !== 0x5a4d) throw new PeError("Not a PE file: missing 'MZ' signature");

  const peOffset = view.getUint32(0x3c, true); // e_lfanew
  checkLength(peOffset, 24, "PE header");
  if (view.getUint32(peOffset, true) !== 0x00004550) throw new PeError("'PE\\0\\0' signature not found");

  // COFF header (20 bytes) right after the signature
  const coff = peOffset + 4;
  const machine = view.getUint16(coff, true);
  const numberOfSections = view.getUint16(coff + 2, true);
  const sizeOfOptionalHeader = view.getUint16(coff + 16, true);

  // Optional header
  const opt = coff + 20;
  checkLength(opt, sizeOfOptionalHeader, "optional header");
  const magic = view.getUint16(opt, true);
  if (magic !== 0x20b && magic !== 0x10b) throw new PeError("Unknown optional header magic");
  const isPe32Plus = magic === 0x20b;

  const entryPointRva = view.getUint32(opt + 16, true);
  const imageBase = isPe32Plus ? view.getBigUint64(opt + 24, true) : BigInt(view.getUint32(opt + 28, true));
  const sizeOfImage = view.getUint32(opt + 56, true);
  const sizeOfHeaders = view.getUint32(opt + 60, true);

  // Section table, right after the optional header
  const sectionTable = opt + sizeOfOptionalHeader;
  checkLength(sectionTable, numberOfSections * 40, "section table");
  const sections: Section[] = [];
  for (let i = 0; i < numberOfSections; i++) {
    const o = sectionTable + i * 40;
    let name = "";
    for (let j = 0; j < 8; j++) {
      const c = view.getUint8(o + j);
      if (c === 0) break;
      name += String.fromCharCode(c);
    }
    sections.push({
      name,
      virtualSize: view.getUint32(o + 8, true),
      virtualAddress: view.getUint32(o + 12, true),
      rawSize: view.getUint32(o + 16, true),
      rawOffset: view.getUint32(o + 20, true),
      characteristics: view.getUint32(o + 36, true),
    });
  }

  return {
    machine,
    isPe32Plus,
    entryPointRva,
    imageBase,
    sizeOfImage,
    peOffset,
    sizeOfOptionalHeader,
    sizeOfHeaders,
    sections,
  };
}
