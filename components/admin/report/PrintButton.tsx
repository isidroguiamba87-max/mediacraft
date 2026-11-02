"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Deliberately not a PDF-generation library — this is just a
 * well-formatted page with print CSS (see the `print:hidden` classes
 * throughout the admin layout and this page). Every browser's own "Print
 * → Save as PDF" already does the job without pulling in a server-side
 * rendering stack for it. */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer size={16} />
      Exportar PDF
    </Button>
  );
}
