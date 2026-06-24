import { useState, useEffect } from "react";
import { fetchPost, fetchPosts } from "../lib/api";
import { fetchLedgerEvents, ledgerEventUrl } from "../lib/ledger";
import type { LedgerEvent } from "../lib/ledger";
import { isEditor } from "../lib/editor";
import { url, assetUrl } from "../lib/base";
import { readingTime } from "../lib/readingTime";
import type { Post } from "../types/post";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const FOREVER_DRAFT_TOOLTIP = "This piece is still evolving — published as a work in progress, not a finished thought.";

export default function PostDetail({ slug: slugProp }: { slug?: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(() => isEditor());
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>([]);
  const [parentPost, setParentPost] = useState<Post | null>(null);
  const [threads, setThreads] = useState<Post[]>([]);

  const slug = slugProp ?? new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("slug") ?? "";

  useEffect(() => {
    fetchLedgerEvents().then(setLedgerEvents).catch(() => {});
  }, []);

  useEffect(() => {
    function sync() { setEditor(isEditor()); }
    window.addEventListener("editor-change", sync);
    return () => window.removeEventListener("editor-change", sync);
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetchPost(slug)
      .then(async p => {
        setPost(p);
        // Load parent and thread children in parallel
        const [allPosts] = await Promise.all([
          fetchPosts({ status: "published" }),
        ]);
        if (p.parent_slug) {
          setParentPost(allPosts.find(x => x.slug === p.parent_slug) ?? null);
        }
        setThreads(allPosts.filter(x => x.parent_slug === p.slug));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-neutral-300 text-sm py-12">Loading…</div>;
  if (!post) return <div className="text-neutral-400 text-sm py-12">Post not found.</div>;

  const mins = readingTime(post.body);

  return (
    <article>
      <header className="mb-8">
        {/* Parent thread link */}
        {parentPost && (
          <a
            href={url(`/post?slug=${parentPost.slug}`)}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition-colors mb-4"
          >
            ← {parentPost.title}
          </a>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400">{post.type}</span>
          {post.status === "draft" && (
            <span className="text-[10px] uppercase tracking-widest text-amber-400">draft</span>
          )}
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
          <p className="text-neutral-500 leading-relaxed mb-4">{post.excerpt}</p>
        )}
        <p className="text-xs text-neutral-300">
          {formatDate(post.created_at)} · {mins} min read
        </p>
      </header>

      {post.lead_image && (
        <div className="w-full aspect-[16/9] overflow-hidden rounded-xl mb-8 bg-neutral-100">
          <img src={assetUrl(post.lead_image!)} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div
        className="tiptap-body"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />

      {/* Thread children */}
      {threads.length > 0 && (
        <section className="mt-12 pt-6 border-t border-neutral-100">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-4">Continued thinking</p>
          <ul className="space-y-4">
            {threads.map(t => (
              <li key={t.slug}>
                <a
                  href={url(`/post?slug=${t.slug}`)}
                  className="group flex items-baseline gap-3 hover:text-neutral-500 transition-colors"
                >
                  <span className="font-serif text-base font-medium group-hover:text-neutral-500">{t.title}</span>
                  <span className="text-xs text-neutral-300 flex-shrink-0">{formatDate(t.created_at)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ledger ticket */}
      {post.related_event_urls.length > 0 && (
        <footer className="mt-12 pt-6 border-t border-neutral-100">
          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Ledger ticket</p>
          <ul className="flex flex-wrap gap-2">
            {post.related_event_urls.map(id => {
              const event = ledgerEvents.find(e => e.id === id);
              return (
                <li key={id}>
                  <a
                    href={ledgerEventUrl(id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs border border-neutral-200 rounded-full px-3 py-1.5 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    {event ? (
                      <>
                        <span>{event.title}</span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-neutral-400">{new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </>
                    ) : id}
                  </a>
                </li>
              );
            })}
          </ul>
        </footer>
      )}
    </article>
  );
}
