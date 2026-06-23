import { useState, useEffect } from "react";
import { fetchPost } from "../lib/api";
import { isEditor } from "../lib/editor";
import { url } from "../lib/base";
import type { Post } from "../types/post";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function PostDetail({ slug: slugProp }: { slug?: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(() => isEditor());

  const slug = slugProp ?? new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("slug") ?? "";

  useEffect(() => {
    function sync() { setEditor(isEditor()); }
    window.addEventListener("editor-change", sync);
    return () => window.removeEventListener("editor-change", sync);
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetchPost(slug)
      .then(setPost)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-neutral-300 text-sm py-12">Loading…</div>;
  if (!post) return <div className="text-neutral-400 text-sm py-12">Post not found.</div>;

  return (
    <article>
      <header className="mb-8">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400">{post.type}</span>
          {post.status === "draft" && (
            <span className="text-[10px] uppercase tracking-widest text-amber-400">draft</span>
          )}
          {editor && (
            <a
              href={url(`/edit?slug=${post.slug}`)}
              className="ml-auto text-xs text-neutral-300 hover:text-neutral-600 transition-colors"
            >
              Edit
            </a>
          )}
        </div>
        <h1 className="font-serif text-3xl font-medium mb-3">{post.title}</h1>
        {post.excerpt && (
          <p className="text-neutral-500 leading-relaxed">{post.excerpt}</p>
        )}
        <p className="text-xs text-neutral-300 mt-4">{formatDate(post.created_at)}</p>
      </header>

      <div
        className="tiptap-body"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />

      {post.related_event_urls.length > 0 && (
        <footer className="mt-12 pt-6 border-t border-neutral-100">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Related events</p>
          <ul className="space-y-1">
            {post.related_event_urls.map(u => (
              <li key={u}>
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-900 transition-colors"
                >
                  {u}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
