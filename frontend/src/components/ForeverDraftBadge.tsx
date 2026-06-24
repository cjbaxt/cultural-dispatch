import { useState } from "react";

const TOOLTIP = "This is a piece I'm still thinking about — I'm probably reading around it, and I may add new threads or change my mind entirely.";

export default function ForeverDraftBadge() {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <span
        className="text-[10px] uppercase tracking-widest text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5 cursor-help"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={e => { e.preventDefault(); e.stopPropagation(); setVisible(v => !v); }}
      >
        forever draft
      </span>
      {visible && (
        <span className="absolute top-full left-0 mt-1.5 w-56 text-xs text-neutral-500 bg-white border border-neutral-200 rounded shadow-sm px-3 py-2 z-10 leading-relaxed pointer-events-none">
          {TOOLTIP}
        </span>
      )}
    </span>
  );
}
