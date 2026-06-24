export const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export function url(path: string) {
  return `${base}${path}`;
}
export function assetUrl(path: string) {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path}`;
}
