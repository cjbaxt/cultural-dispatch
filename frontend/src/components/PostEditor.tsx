import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { createPost, updatePost, deletePost } from "../lib/api";
import { url } from "../lib/base";
import { fetchLedgerEvents } from "../lib/ledger";
import type { LedgerEvent } from "../lib/ledger";
import type { Post } from "../types/post";

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

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
  const [eventSearch, setEventSearch] = useState("");
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchLedgerEvents().then(setLedgerEvents).catch(() => {});
  }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");

  // Tracks the slug once a new post has been created, so autosave can PATCH thereafter
  const savedSlugRef = useRef<string | null>(post?.slug ?? null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    onUpdate: () => scheduleAutosave(),
  });

  function addEvent(id: string) {
    if (!relatedUrls.includes(id)) {
      setRelatedUrls(prev => [...prev, id]);
    }
    setEventSearch("");
    setShowSuggestions(false);
  }

  function removeUrl(u: string) {
    setRelatedUrls(prev => prev.filter(x => x !== u));
  }

  const suggestions = eventSearch.length > 1
    ? ledgerEvents.filter(e =>
        e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        e.venue_name.toLowerCase().includes(eventSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  // Use refs so the autosave closure always sees current values without re-registering
  const titleRef = useRef(title);
  const typeRef = useRef(type);
  const statusRef = useRef(status);
  const excerptRef = useRef(excerpt);
  const relatedUrlsRef = useRef(relatedUrls);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { typeRef.current = type; }, [type]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { excerptRef.current = excerpt; }, [excerpt]);
  useEffect(() => { relatedUrlsRef.current = relatedUrls; }, [relatedUrls]);

  const scheduleAutosave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const currentTitle = titleRef.current.trim();
      if (!currentTitle) return;

      setAutoSaveStatus("saving");
      const data = {
        title: currentTitle,
        type: typeRef.current,
        status: statusRef.current,
        excerpt: excerptRef.current.trim() || null,
        body: editor?.getHTML() ?? "",
        related_event_urls: relatedUrlsRef.current,
        slug: savedSlugRef.current ?? slugify(currentTitle),
      };

      try {
        if (savedSlugRef.current) {
          await updatePost(savedSlugRef.current, data);
        } else {
          const created = await createPost({ ...data, status: "draft" });
          savedSlugRef.current = created.slug;
          // Update URL so a refresh opens the edit page, not a blank /add
          window.history.replaceState({}, "", url(`/edit?slug=${created.slug}`));
        }
        setAutoSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setAutoSaveStatus("idle"), 2000);
      } catch {
        setAutoSaveStatus("error");
      }
    }, 2000);
  }, [editor]);

  // Trigger autosave when fields change
  useEffect(() => { scheduleAutosave(); }, [title, type, excerpt, relatedUrls]);

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

  const handleDelete = useCallback(async () => {
    if (!isEdit || status === "published") return;
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deletePost(post.slug);
      window.location.href = url("/");
    } catch (e: any) {
      setError(e.message ?? "Delete failed.");
    }
  }, [isEdit, status, title, post]);

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
        {isEdit && status === "draft" && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-neutral-300 hover:text-red-400 transition-colors cursor-pointer"
          >
            Delete draft
          </button>
        )}
        <div className="flex gap-3 ml-auto items-center">
          {autoSaveStatus === "saving" && (
            <span className="text-xs text-neutral-400">Saving…</span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs text-neutral-400">Saved</span>
          )}
          {autoSaveStatus === "error" && (
            <span className="text-xs text-red-400">Autosave failed</span>
          )}
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

      {/* Subtitle */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-1.5">Subtitle</label>
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Shown below the title…"
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

      {/* Related events */}
      <div>
        <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-1.5">Related events</label>
        <div className="relative mb-2">
          <input
            type="text"
            value={eventSearch}
            onChange={e => { setEventSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search your ledger…"
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-400 transition-colors placeholder-neutral-300"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
              {suggestions.map(e => (
                <li key={e.id}>
                  <button
                    type="button"
                    onMouseDown={() => addEvent(e.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-neutral-800">{e.title}</span>
                    <span className="text-neutral-400 ml-2 text-xs">{e.venue_name} · {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {relatedUrls.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {relatedUrls.map(id => {
              const event = ledgerEvents.find(e => e.id === id);
              return (
                <li key={id} className="flex items-center gap-1.5 text-xs bg-neutral-100 rounded-full px-3 py-1">
                  <span className="text-neutral-700">{event ? event.title : id}</span>
                  <button
                    type="button"
                    onClick={() => removeUrl(id)}
                    className="text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
