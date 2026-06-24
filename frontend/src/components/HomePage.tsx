import { useState, useEffect } from "react";
import { fetchPosts } from "../lib/api";
import { url } from "../lib/base";
import { readingTime } from "../lib/readingTime";
import type { Post } from "../types/post";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const FOREVER_DRAFT_TOOLTIP = "This piece is still evolving — published as a work in progress, not a finished thought.";

function FeaturedCard({ post, large }: { post: Post; large?: boolean }) {
  return (
    <a
      href={url(`/post?slug=${post.slug}`)}
      className="group block h-full"
    >
      <article className="h-full flex flex-col">
        {post.lead_image && (
          <div className={`w-full overflow-hidden rounded-xl bg-neutral-100 mb-4 ${large ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
            <img
              src={url(post.lead_image)}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400">{post.type}</span>
          {post.is_forever_draft && (
            <span
              className="text-[10px] uppercase tracking-widest text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5 cursor-help"
              title={FOREVER_DRAFT_TOOLTIP}
            >
              still thinking
            </span>
          )}
          {post.parent_slug && (
            <span className="text-[10px] uppercase tracking-widest text-neutral-400">thread</span>
          )}
        </div>
        <h2 className={`font-serif font-medium group-hover:text-neutral-500 transition-colors mb-2 ${large ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p className={`text-neutral-500 leading-relaxed line-clamp-3 mb-3 ${large ? "text-sm sm:text-base" : "text-sm"}`}>
            {post.excerpt}
          </p>
        )}
        <p className="text-xs text-neutral-300 mt-auto">
          {formatDate(post.created_at)} · {readingTime(post.body)} min read
        </p>
      </article>
    </a>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts({ status: "published" })
      .then(posts => setFeatured(posts.filter(p => p.featured)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-neutral-300 text-sm py-12">Loading…</div>;

  if (featured.length === 0) {
    return (
      <p className="text-neutral-400 text-sm py-12">
        No featured posts yet — mark posts as featured in the editor.
      </p>
    );
  }

  const [first, ...rest] = featured;

  return (
    <div className="space-y-10">
      {/* Hero — first featured post */}
      <FeaturedCard post={first} large />

      {/* Secondary grid */}
      {rest.length > 0 && (
        <>
          <hr className="border-neutral-100" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {rest.slice(0, 4).map(post => (
              <FeaturedCard key={post.slug} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
