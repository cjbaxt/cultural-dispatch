import { useState, useEffect } from "react";
import { isEditor } from "../lib/editor";
import { url } from "../lib/base";

export default function EditorGate({ children }: { children: React.ReactNode }) {
  const [editor, setEditor] = useState<boolean | null>(null);

  useEffect(() => {
    setEditor(isEditor());
    function sync() { setEditor(isEditor()); }
    window.addEventListener("editor-change", sync);
    return () => window.removeEventListener("editor-change", sync);
  }, []);

  if (editor === null) return null;

  if (!editor) {
    return (
      <div className="text-center py-20 text-neutral-400 text-sm">
        <p>Double-tap <kbd className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">e</kbd> to unlock editor mode.</p>
      </div>
    );
  }

  return <>{children}</>;
}
