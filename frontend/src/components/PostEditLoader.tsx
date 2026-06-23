import { useState, useEffect } from "react";
import { fetchPost } from "../lib/api";
import { isEditor } from "../lib/editor";
import PostEditor from "./PostEditor";
import type { Post } from "../types/post";

export default function PostEditLoader({ slug: slugProp }: { slug?: string }) {
  const slug = slugProp ?? (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("slug") ?? "" : "");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<boolean | null>(null);

  useEffect(() => {
    setEditor(isEditor());
    function sync() { setEditor(isEditor()); }
    window.addEventListener("editor-change", sync);
    return () => window.removeEventListener("editor-change", sync);
  }, []);

  useEffect(() => {
    fetchPost(slug)
      .then(setPost)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (editor === null || loading) return null;

  if (!editor) {
    return (
      <div className="text-center py-20 text-neutral-400 text-sm">
        <p>Double-tap <kbd className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">e</kbd> to unlock editor mode.</p>
      </div>
    );
  }

  if (!post) return <div className="text-neutral-400 text-sm py-12">Post not found.</div>;

  return <PostEditor post={post} />;
}
