import { useState, useEffect } from "react";
import { fetchPosts, deletePost } from "../lib/api";
import { isEditor } from "../lib/editor";
import { url } from "../lib/base";
import type { Post } from "../types/post";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(() => isEditor());

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

  if (loading) return <div className="text-neutral-300 text-sm py-12">Loading…</div>;

  if (posts.length === 0) {
    return (
      <div className="text-neutral-400 text-sm py-12">
        {editor ? "No posts yet. Write something." : "Nothing published yet."}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {posts.map(post => (
        <li key={post.slug} className="py-6 group">
          <a href={url(`/post?slug=${post.slug}`)} className="block">
            <div className="flex items-baseline gap-3 mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400">{post.type}</span>
              {post.status === "draft" && (
                <span className="text-[10px] uppercase tracking-widest text-amber-400">draft</span>
              )}
            </div>
            <h2 className="font-serif text-xl font-medium group-hover:text-neutral-500 transition-colors mb-2">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
            )}
            <p className="text-xs text-neutral-300 mt-3">{formatDate(post.created_at)}</p>
          </a>
          {editor && (
            <div className="flex items-center gap-3 mt-2">
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
  );
}
