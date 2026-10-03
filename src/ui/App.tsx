import { useState } from "react";
import { parsePe, type PeInfo } from "../core/pe/parser";
import { HexDump } from "./HexDump";
import { PeSummary } from "./PeSummary";

interface Loaded {
  fileName: string;
  fileSize: number;
  bytes: Uint8Array;
  pe: PeInfo;
}

export function App() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const pe = parsePe(buffer);
      setLoaded({ fileName: file.name, fileSize: file.size, bytes: new Uint8Array(buffer), pe });
      setError(null);
    } catch (err) {
      setLoaded(null);
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <h1>Binary Playground</h1>
      <input type="file" accept=".exe" onChange={onFileChange} />
      {error && <pre>Error: {error}</pre>}
      {loaded ? (
        <>
          <PeSummary fileName={loaded.fileName} fileSize={loaded.fileSize} pe={loaded.pe} />
          <HexDump bytes={loaded.bytes} pe={loaded.pe} />
        </>
      ) : (
        !error && <p>Select an .exe file to get started.</p>
      )}
    </main>
  );
}
