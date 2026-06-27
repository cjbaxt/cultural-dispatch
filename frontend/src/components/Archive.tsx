import { useState, useEffect } from "react";
import { fetchPosts, deletePost } from "../lib/api";
import { isEditor } from "../lib/editor";
import { url, assetUrl } from "../lib/base";
import { readingTime } from "../lib/readingTime";
import type { Post } from "../types/post";
import ForeverDraftBadge from "./ForeverDraftBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}


export default function Archive() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(() => isEditor());
  const [filter, setFilter] = useState<"all" | "dispatch" | "essay" | "film">("all");

  useEffect(() => {
    function sync() { setEditor(isEditor()); }
    window.addEventListener("editor-change", sync);
    return () => window.removeEventListener("editor-change", sync);
  }, []);

  useEffect(() => {
    fetchPosts(editor ? {} : { status: "published" })
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [editor]);

  const filtered = filter === "all" ? posts : posts.filter(p => p.type === filter);

  if (loading) return <div className="text-neutral-300 text-sm py-12">Loading…</div>;

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-2 mb-8">
        {(["all", "dispatch", "essay", "film"] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filter === f
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-neutral-400 text-sm py-12">Nothing here yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {filtered.map(post => (
            <li key={post.slug} className="py-6 group">
              <a href={url(`/post?slug=${post.slug}`)} className="block">
                <div className="flex gap-6 items-start">
                  <div className="flex-1 min-w-0">
                    {/* Type + status chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] uppercase tracking-widest text-neutral-400">{post.type}</span>
                      {post.status === "draft" && (
                        <span className="text-[10px] uppercase tracking-widest text-amber-400">draft</span>
                      )}
                      {post.is_forever_draft && <ForeverDraftBadge />}
                      {post.parent_slug && (
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400">thread</span>
                      )}
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-medium group-hover:text-neutral-500 transition-colors mb-1">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2 mb-2">{post.excerpt}</p>
                    )}
                    <p className="text-xs text-neutral-300">
                      {formatDate(post.created_at)} · {readingTime(post.body)} min read · Claire
                    </p>
                  </div>
                  {/* Lead image — right side */}
                  {post.lead_image && (
                    <div className="flex-shrink-0 w-28 h-20 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-neutral-100">
                      <img src={assetUrl(post.lead_image)} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </a>
              {editor && (
                <div className="flex items-center gap-3 mt-2 pl-0">
                  <a
                    href={url(`/edit?slug=${post.slug}`)}
                    className="text-xs text-neutral-300 hover:text-neutral-600 transition-colors"
                  >
                    Edit
                  </a>
                  {post.status === "draft" && (
                    <button
                      type="button"
                      onClick={async e => {
                        e.preventDefault();
                        if (!window.confirm(`Delete "${post.title}"?`)) return;
                        await deletePost(post.slug);
                        setPosts(prev => prev.filter(p => p.slug !== post.slug));
                      }}
                      className="text-xs text-neutral-300 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
