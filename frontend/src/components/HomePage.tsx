import { useState, useEffect } from "react";
import { fetchPosts } from "../lib/api";
import { url, assetUrl } from "../lib/base";
import ForeverDraftBadge from "./ForeverDraftBadge";
import { readingTime } from "../lib/readingTime";
import type { Post } from "../types/post";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}


function FeaturedCard({ post, large }: { post: Post; large?: boolean }) {
  if (!large) {
    // Secondary cards: horizontal on mobile, vertical on desktop
    return (
      <a href={url(`/post/${post.slug}/`)} className="group block">
        <article className="flex sm:flex-col gap-4 sm:gap-0 sm:h-full">
          {post.lead_image && (
            <div className="flex-shrink-0 w-24 h-20 sm:w-full sm:aspect-[4/3] sm:h-auto overflow-hidden rounded-lg sm:rounded-xl bg-neutral-100 sm:mb-4">
              <img
                src={assetUrl(post.lead_image)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400">{post.type}</span>
              {post.is_forever_draft && <ForeverDraftBadge />}
              {post.parent_slug && <span className="text-[10px] uppercase tracking-widest text-neutral-400">thread</span>}
            </div>
            <h2 className="font-serif font-medium text-base sm:text-xl group-hover:text-neutral-500 transition-colors mb-1 sm:mb-2 line-clamp-2">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="hidden sm:block text-sm text-neutral-500 leading-relaxed line-clamp-3 mb-3">
                {post.excerpt}
              </p>
            )}
            <p className="text-xs text-neutral-300 mt-auto">
              {formatDate(post.created_at)} · {readingTime(post.body)} min read · Claire
            </p>
          </div>
        </article>
      </a>
    );
  }

  return (
    <a href={url(`/post/${post.slug}/`)} className="group block h-full">
      <article className="h-full flex flex-col">
        {post.lead_image && (
          <div className="w-full overflow-hidden rounded-xl bg-neutral-100 mb-4 aspect-[16/9]">
            <img
              src={assetUrl(post.lead_image)}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400">{post.type}</span>
          {post.is_forever_draft && <ForeverDraftBadge />}
          {post.parent_slug && <span className="text-[10px] uppercase tracking-widest text-neutral-400">thread</span>}
        </div>
        <h2 className="font-serif font-medium text-2xl sm:text-3xl group-hover:text-neutral-500 transition-colors mb-2">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm sm:text-base text-neutral-500 leading-relaxed line-clamp-3 mb-3">
            {post.excerpt}
          </p>
        )}
        <p className="text-xs text-neutral-300 mt-auto">
          {formatDate(post.created_at)} · {readingTime(post.body)} min read · Claire
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
      {/* Masthead */}
      <div className="pb-6 border-b border-neutral-200">
        <p className="font-serif text-4xl sm:text-5xl tracking-tight text-neutral-900">cultural dispatch</p>
        <p className="text-xs text-neutral-400 mt-2 tracking-wide">writing on arts and ideas</p>
      </div>

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
