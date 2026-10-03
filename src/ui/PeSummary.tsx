import type { PeInfo } from "../core/pe/parser";
import { Tip } from "./Tip";

const hex = (n: number | bigint) => "0x" + n.toString(16);

const SECTION_HELP: Record<string, string> = {
  ".text": "Executable machine code of the program.",
  ".data": "Initialized global and static variables (read/write).",
  ".rdata": "Read-only data: constants, strings and import/debug tables.",
  ".idata": "Import table: the DLL functions this program needs.",
  ".edata": "Export table: functions this module offers to others.",
  ".rsrc": "Resources: icons, dialogs, version info, embedded files.",
  ".reloc": "Base relocations, applied if the image is loaded at a different address.",
  ".pdata": "Exception-handling data (unwind info) used on x64.",
  ".bss": "Uninitialized data, zero-filled at load time.",
  ".tls": "Thread-local storage data.",
};

interface Props {
  fileName: string;
  fileSize: number;
  pe: PeInfo;
}

export function PeSummary({ fileName, fileSize, pe }: Props) {
  return (
    <section>
      <p>
        <Tip tip="Name and size on disk of the file you loaded.">File</Tip>: {fileName} ({fileSize} bytes)
      </p>
      <p>
        <Tip tip="PE32 is a 32-bit executable (x86); PE32+ is a 64-bit one (x86-64). It is set by the optional header magic (0x10b / 0x20b), and it determines register and pointer sizes.">
          Format
        </Tip>
        : {pe.isPe32Plus ? "PE32+ (64 bits)" : "PE32 (32 bits)"},{" "}
        <Tip tip="Target CPU architecture from the COFF header. 0x14c = Intel 386 (x86), 0x8664 = AMD64 (x86-64).">
          machine
        </Tip>{" "}
        {hex(pe.machine)}
      </p>
      <p>
        <Tip tip="Preferred virtual address where the file is loaded in memory. Every RVA is relative to this address; the real address is ImageBase + RVA.">
          ImageBase
        </Tip>
        : {hex(pe.imageBase)}
      </p>
      <p>
        <Tip tip="Relative Virtual Address of the first instruction executed. Its absolute address is ImageBase + this value, and it is where the emulation would start.">
          EntryPoint RVA
        </Tip>
        : {hex(pe.entryPointRva)}
      </p>
      <h2>
        <Tip tip="Contiguous blocks of the file (code, data, resources...) that the loader maps into memory, each with its own permissions.">
          Sections
        </Tip>
      </h2>
      <table>
        <thead>
          <tr>
            <th>
              <Tip tip="Section name (up to 8 characters). By convention it hints at the content, but it is not enforced.">
                Name
              </Tip>
            </th>
            <th>
              <Tip tip="Relative Virtual Address: where the section starts in memory, as an offset from ImageBase.">
                RVA
              </Tip>
            </th>
            <th>
              <Tip tip="Virtual size: bytes the section occupies once loaded in memory. It can be larger than its size on disk (the rest is zero-filled).">
                Size
              </Tip>
            </th>
            <th>
              <Tip tip="Position of the section's data inside the file on disk. This is where its bytes are copied from when loading.">
                File offset
              </Tip>
            </th>
          </tr>
        </thead>
        <tbody>
          {[...pe.sections]
            .sort((a, b) => a.rawOffset - b.rawOffset)
            .map((s) => (
            <tr key={s.name + s.virtualAddress}>
              <td>
                {SECTION_HELP[s.name] ? <Tip tip={SECTION_HELP[s.name]}>{s.name}</Tip> : s.name}
              </td>
              <td>{hex(s.virtualAddress)}</td>
              <td>{hex(s.virtualSize)}</td>
              <td>{hex(s.rawOffset)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
