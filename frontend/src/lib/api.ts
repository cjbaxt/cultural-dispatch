import type { Post } from "../types/post";

export const STATIC = import.meta.env.PUBLIC_STATIC_DATA === "true";
export const DATA = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

async function staticFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA}${path}`);
  if (!res.ok) throw new Error(`Static fetch failed: ${path}`);
  return res.json();
}

let _postsCache: Post[] | null = null;

export async function fetchPosts(params: {
  status?: string;
  type?: string;
} = {}): Promise<Post[]> {
  if (STATIC) {
    if (!_postsCache) _postsCache = await staticFetch<Post[]>("/data/posts.json");
    let results = _postsCache;
    if (params.status) results = results.filter(p => p.status === params.status);
    if (params.type) results = results.filter(p => p.type === params.type);
    return results;
  }
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.type) qs.set("type", params.type);
  const res = await fetch(`/api/posts?${qs}`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

export async function fetchPost(slug: string): Promise<Post> {
  if (STATIC) {
    return staticFetch<Post>(`/data/posts/${slug}.json`);
  }
  const res = await fetch(`/api/posts/${slug}`);
  if (!res.ok) throw new Error(`Failed to fetch post: ${res.status}`);
  return res.json();
}

export async function createPost(data: Omit<Post, "id" | "created_at" | "updated_at">): Promise<Post> {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create post: ${res.status}`);
  return res.json();
}

export async function updatePost(slug: string, data: Omit<Post, "id" | "created_at" | "updated_at">): Promise<Post> {
  const res = await fetch(`/api/posts/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update post: ${res.status}`);
  return res.json();
}

export async function deletePost(slug: string): Promise<void> {
  const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete post: ${res.status}`);
}
