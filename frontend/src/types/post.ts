export interface Post {
  id: string;
  slug: string;
  title: string;
  type: "essay" | "review";
  status: "draft" | "published";
  excerpt: string | null;
  body: string;
  related_event_urls: string[];
  created_at: string;
  updated_at: string;
}
