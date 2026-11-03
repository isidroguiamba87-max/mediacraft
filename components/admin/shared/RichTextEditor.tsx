"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WYSIWYG replacement for a plain `<textarea name="body">` in an admin
 * form — same field name, same submission flow (a hidden input mirrors
 * the editor's HTML on every change, so the enclosing `<form action={...
 * Server Action}>` reads it exactly like it read the old textarea's
 * value, no Server Action changes needed).
 *
 * Headings capped at h2/h3 on purpose — the public page this content
 * lands on (`/novidades/[id]`) already renders its own `<h1>` for the
 * article title; letting an admin add a second `<h1>` inside the body
 * would reintroduce the "more than one h1 per page" bug fixed elsewhere
 * this session. Output tags match SafeHtml's `ALLOWED_TAGS` (the
 * sanitizer that actually runs before this ever reaches a visitor), and
 * the toolbar's styling mirrors SafeHtml's own classes so what you see
 * here is close to what renders on the site.
 */
export function RichTextEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [html, setHtml] = useState(defaultValue ?? "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: defaultValue ?? "",
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[260px] px-4 py-3 text-sm text-ink outline-none",
          "[&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:first:mt-0",
          "[&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:first:mt-0",
          "[&_p]:mt-2 [&_p]:first:mt-0",
          "[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_a]:text-brand-red [&_a]:underline [&_a]:underline-offset-2",
          "[&_strong]:font-semibold",
        ),
      },
    },
  });

  function toggleLink() {
    if (!editor) return;
    const existing = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Endereço do link", existing ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="rounded-brand border border-line bg-paper">
      <div className="flex flex-wrap gap-1 border-b border-line p-2">
        <ToolbarButton
          label="Negrito"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Itálico"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Título"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Subtítulo"
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Lista"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerada"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor?.isActive("link")} onClick={toggleLink}>
          <LinkIcon size={15} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active ?? false}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-brand text-slate hover:bg-paper-2",
        active && "bg-brand-navy text-white hover:bg-brand-navy",
      )}
    >
      {children}
    </button>
  );
}
