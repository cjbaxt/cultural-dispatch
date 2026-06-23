import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { createPost, updatePost } from "../lib/api";
import { url } from "../lib/base";
import type { Post } from "../types/post";

interface Props {
  post?: Post;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ToolbarButton({ onClick, active, title, children }: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-sm rounded transition-colors ${
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function PostEditor({ post }: Props) {
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [type, setType] = useState<"essay" | "review">(post?.type ?? "essay");
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [relatedUrls, setRelatedUrls] = useState<string[]>(post?.related_event_urls ?? []);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: post?.body ?? "",
    editorProps: {
      attributes: {
        class: "tiptap-body min-h-[300px] focus:outline-none",
      },
    },
  });

  function addUrl() {
    const trimmed = urlInput.trim();
    if (trimmed && !relatedUrls.includes(trimmed)) {
      setRelatedUrls(prev => [...prev, trimmed]);
    }
    setUrlInput("");
  }

  function removeUrl(u: string) {
    setRelatedUrls(prev => prev.filter(x => x !== u));
  }

  const handleSave = useCallback(async (targetStatus?: "draft" | "published") => {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError(null);
    const finalStatus = targetStatus ?? status;
    const body = editor?.getHTML() ?? "";
    const data = {
      title: title.trim(),
      type,
      status: finalStatus,
      excerpt: excerpt.trim() || null,
      body,
      related_event_urls: relatedUrls,
      slug: isEdit ? post.slug : slugify(title.trim()),
    };
    try {
      if (isEdit) {
        await updatePost(post.slug, data);
      } else {
        const created = await createPost(data);
        window.location.href = url(`/post?slug=${created.slug}`);
        return;
      }
      setStatus(finalStatus);
    } catch (e: any) {
      setError(e.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [title, type, status, excerpt, relatedUrls, editor, isEdit, post]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full font-serif text-2xl font-medium placeholder-neutral-300 border-none focus:outline-none bg-transparent"
      />

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {(["essay", "review"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                type === t
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-4 py-1.5 text-sm border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {status === "published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Excerpt */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-1.5">Excerpt</label>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Short summary shown in the post list…"
          className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-400 transition-colors resize-none placeholder-neutral-300"
        />
      </div>

      {/* Body editor */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-1.5">Body</label>
        {editor && (
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-0.5 px-3 py-2 border-b border-neutral-100 bg-neutral-50">
              <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
                <strong>B</strong>
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
                <em>I</em>
              </ToolbarButton>
              <span className="w-px bg-neutral-200 mx-1 self-stretch" />
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
                H2
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
                H3
              </ToolbarButton>
              <span className="w-px bg-neutral-200 mx-1 self-stretch" />
              <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
                •–
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
                1.
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
                "
              </ToolbarButton>
              <span className="w-px bg-neutral-200 mx-1 self-stretch" />
              <ToolbarButton
                onClick={() => {
                  if (editor.isActive("link")) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    const href = window.prompt("URL");
                    if (href) editor.chain().focus().setLink({ href }).run();
                  }
                }}
                active={editor.isActive("link")}
                title="Link"
              >
                ↗
              </ToolbarButton>
            </div>
            <div className="tiptap-editor px-4 py-4">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>

      {/* Related event URLs */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-1.5">Related events</label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
            placeholder="https://cjbaxt.github.io/events-ledger/…"
            className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-400 transition-colors placeholder-neutral-300"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!urlInput.trim()}
            className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:border-neutral-400 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Add
          </button>
        </div>
        {relatedUrls.length > 0 && (
          <ul className="space-y-1">
            {relatedUrls.map(u => (
              <li key={u} className="flex items-center gap-2 text-sm">
                <span className="flex-1 text-neutral-600 truncate">{u}</span>
                <button
                  type="button"
                  onClick={() => removeUrl(u)}
                  className="text-neutral-300 hover:text-neutral-600 transition-colors cursor-pointer"
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
