import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useRef } from "react";

function ImageFigureView({ node, updateAttributes }: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <NodeViewWrapper>
      <figure className="my-6">
        <img
          src={node.attrs.src}
          alt={node.attrs.caption ?? ""}
          className="w-full rounded-sm block"
        />
        <figcaption className="mt-2 text-center">
          <input
            ref={inputRef}
            type="text"
            value={node.attrs.caption ?? ""}
            onChange={e => updateAttributes({ caption: e.target.value })}
            placeholder="Add a caption…"
            className="w-full text-center text-xs text-neutral-400 placeholder-neutral-300 bg-transparent border-none focus:outline-none focus:ring-0"
          />
        </figcaption>
      </figure>
    </NodeViewWrapper>
  );
}

export const ImageFigureExtension = Node.create({
  name: "imageFigure",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          // Only match plain figures (not Substack ones with image2-inset)
          if (el.querySelector(".image2-inset")) return false;
          const img = el.querySelector("img");
          if (!img) return false;
          const figcaption = el.querySelector("figcaption");
          return {
            src: img.getAttribute("src"),
            caption: figcaption?.textContent?.trim() ?? "",
          };
        },
        priority: 60, // higher than FigureExtension (default 50)
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "figure",
      {},
      ["img", mergeAttributes({ src: node.attrs.src, alt: node.attrs.caption ?? "" })],
      ["figcaption", {}, node.attrs.caption ?? ""],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageFigureView);
  },
});
