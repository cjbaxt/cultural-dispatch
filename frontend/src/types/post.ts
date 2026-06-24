export interface Post {
  id: string;
  slug: string;
  title: string;
  type: "essay" | "dispatch" | "movie review";
  status: "draft" | "published";
  excerpt: string | null;
  body: string;
  related_event_urls: string[];
  lead_image: string | null;
  is_forever_draft: boolean;
  featured: boolean;
  parent_slug: string | null;
  created_at: string;
  updated_at: string;
}
