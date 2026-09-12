"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  ImagePlus,
  Link2,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40",
        active && "bg-surface-muted text-primary"
      )}
    >
      {children}
    </button>
  );
}

function LinkPopover({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState(editor.getAttributes("link").href ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function applyLink() {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    }
    onClose();
  }

  return (
    <div className="absolute left-0 top-full z-10 mt-1 flex items-center gap-1.5 rounded-lg border border-border bg-surface p-1.5 shadow-md">
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            applyLink();
          }
          if (e.key === "Escape") onClose();
        }}
        placeholder="https://example.com"
        className="h-7 w-56 rounded border border-border bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      <button
        type="button"
        onClick={applyLink}
        className="h-7 rounded bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
      >
        Apply
      </button>
    </div>
  );
}

/**
 * There's no file storage wired up for this app (no blob/S3 client
 * anywhere in the codebase), so this can't be a real upload button. It
 * matches the documented workflow instead: drop the file in the project's
 * public/blog folder yourself, then point the editor at that path.
 */
function ImagePopover({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function applyImage() {
    const trimmed = url.trim();
    if (trimmed) {
      editor.chain().focus().setImage({ src: trimmed }).run();
    }
    onClose();
  }

  return (
    <div className="absolute left-0 top-full z-10 mt-1 flex items-center gap-1.5 rounded-lg border border-border bg-surface p-1.5 shadow-md">
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            applyImage();
          }
          if (e.key === "Escape") onClose();
        }}
        placeholder="/blog/your-image.jpg"
        className="h-7 w-56 rounded border border-border bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />
      <button
        type="button"
        onClick={applyImage}
        className="h-7 rounded bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
      >
        Insert
      </button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [linkMenuOpen, setLinkMenuOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Tiptap v3's StarterKit bundles Underline and Link itself (it
      // didn't in v2), so the toolbar's underline button and link popover
      // just work without adding those as separate extensions.
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl" } }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write your post...",
      }),
      // TableKit (v3) bundles Table + TableRow + TableHeader + TableCell
      // from a single @tiptap/extension-table package. TableKit's own
      // options just say which sub-extensions to register (or disable);
      // each one's actual settings nest under its own key, so the table's
      // resizable flag goes under `table`, not at the top level. false
      // keeps columns evenly sized (table-fixed below) instead of needing
      // extra CSS for drag handles.
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose-content min-h-[320px] rounded-b-lg px-3 py-3 text-sm text-foreground focus:outline-none [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-semibold [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:mt-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted [&_hr]:my-4 [&_hr]:border-border [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_a]:text-primary [&_a]:underline [&_img]:mt-3 [&_img]:max-w-full [&_table]:mt-3 [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-surface-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:align-top [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top [&_td]:text-xs [&_td_p]:mt-0",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[360px] rounded-lg border border-border bg-surface px-3 py-3 text-sm text-muted">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="relative flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 4"
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <Heading4 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolbarButton
          label="Bulleted list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert table"
          disabled={editor.isActive("table")}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border" />

        <div className="relative">
          <ToolbarButton
            label="Insert image"
            onClick={() => setImageMenuOpen((open) => !open)}
          >
            <ImagePlus className="h-4 w-4" />
          </ToolbarButton>
          {imageMenuOpen && (
            <ImagePopover editor={editor} onClose={() => setImageMenuOpen(false)} />
          )}
        </div>
        <div className="relative">
          <ToolbarButton
            label="Link"
            active={editor.isActive("link")}
            onClick={() => setLinkMenuOpen((open) => !open)}
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          {linkMenuOpen && (
            <LinkPopover editor={editor} onClose={() => setLinkMenuOpen(false)} />
          )}
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
