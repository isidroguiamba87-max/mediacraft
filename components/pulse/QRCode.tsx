"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { makeQrSvg } from "@/lib/qr";
import { Button } from "@/components/ui/Button";

export function QRCode({
  seed,
  size = 180,
  downloadLabel,
  fileName,
}: {
  seed: string;
  size?: number;
  downloadLabel?: string;
  fileName?: string;
}) {
  const svg = useMemo(() => makeQrSvg(seed), [seed]);

  function download() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName ?? seed}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        style={{ width: size, height: size }}
        // Locally generated, deterministic SVG (lib/qr.ts) — no external/user input.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {downloadLabel && (
        <Button variant="ghost" size="md" onClick={download} className="w-full justify-center">
          <Download size={15} />
          {downloadLabel}
        </Button>
      )}
    </div>
  );
}
