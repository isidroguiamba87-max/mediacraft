"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface ImagePreview {
  url: string;
  name: string;
}

/** Unique enough for "same file picked again" without hashing contents. */
function fileKey(f: File) {
  return `${f.name}|${f.size}|${f.lastModified}`;
}

/**
 * Thumbnail previews for the selected files, before upload — lets the
 * admin see exactly what's about to go out, and drop a wrong pick before
 * submitting. Re-opening the file dialog ADDS to the current selection
 * instead of replacing it (a plain `<input multiple>` always replaces on
 * re-selection — picking 5, then 7 more, must end up as 12, not 7), so
 * this keeps its own accumulated file list and rebuilds the input's
 * FileList via DataTransfer every time it changes, since a native file
 * input's FileList can't be edited in place.
 *
 * Shared between the Galeria and Novidades admin uploaders — give it a
 * fresh `key` after a successful submit to clear it (`form.reset()`
 * alone doesn't fire its onChange).
 */
export function ImagePicker({ inputId }: { inputId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<ImagePreview[]>([]);

  // Revoke object URLs on change/unmount so they don't leak memory.
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  function applyFiles(next: File[]) {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setFiles(next);
    setPreviews(next.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));

    if (inputRef.current) {
      const transfer = new DataTransfer();
      next.forEach((f) => transfer.items.add(f));
      inputRef.current.files = transfer.files;
    }
  }

  function onPick(picked: FileList | null) {
    const incoming = Array.from(picked ?? []);
    const existingKeys = new Set(files.map(fileKey));
    const merged = [...files, ...incoming.filter((f) => !existingKeys.has(fileKey(f)))];
    applyFiles(merged);
  }

  function removeAt(index: number) {
    applyFiles(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        name="files"
        type="file"
        accept="image/*"
        multiple
        required={files.length === 0}
        onChange={(e) => onPick(e.target.files)}
        className="h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red"
      />

      {previews.length > 0 && (
        <>
          <p className="mt-2 text-xs text-slate">
            {previews.length === 1 ? "1 imagem seleccionada" : `${previews.length} imagens seleccionadas`} — podes
            continuar a escolher mais.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {previews.map((p, i) => (
              <div key={p.url} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-brand border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, never persisted */}
                <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remover ${p.name}`}
                  className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
