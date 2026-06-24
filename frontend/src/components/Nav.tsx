import { useState, useEffect } from "react";
import { isEditor } from "../lib/editor";
import { url } from "../lib/base";

const links = [
  { path: "/", href: url("/"), label: "Home" },
  { path: "/archive", href: url("/archive"), label: "Archive" },
  { path: "/about", href: url("/about"), label: "About" },
];

export default function Nav({ current }: { current: string }) {
  const [editor, setEditor] = useState(() => isEditor());
  useEffect(() => {
    function sync() { setEditor(isEditor()); }
    window.addEventListener("editor-change", sync);
    return () => window.removeEventListener("editor-change", sync);
  }, []);

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex fixed top-0 inset-x-0 z-40 h-14 border-b border-neutral-100 bg-white/90 backdrop-blur-sm items-center px-8">
        <a href={url("/")} className="font-serif text-lg tracking-tight mr-10 hover:text-neutral-600 transition-colors">
          cultural dispatch
        </a>
        <nav className="flex gap-8 flex-1">
          {links.map(({ path, href, label }) => {
            const active = current === path;
            return (
              <a
                key={href}
                href={href}
                className={`text-sm pb-0.5 transition-colors ${
                  active
                    ? "text-neutral-900 border-b border-neutral-900"
                    : "text-neutral-400 hover:text-neutral-700"
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>
        {editor && (
          <a href={url("/add")} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            + New post
          </a>
        )}
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-neutral-100 bg-white/95 backdrop-blur-sm flex items-center">
        {links.map(({ path, href, label }) => {
          const active = current === path;
          return (
            <a
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 pt-2 text-sm transition-colors ${
                active ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              {label}
            </a>
          );
        })}
        {editor && (
          <a href={url("/add")} className="flex-1 flex flex-col items-center gap-1 pt-2 text-sm text-neutral-400 hover:text-neutral-900 transition-colors">
            + New
          </a>
        )}
      </nav>
    </>
  );
}
