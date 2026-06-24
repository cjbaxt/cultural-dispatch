import { Node } from "@tiptap/core";

// Preserves Substack <figure> elements as opaque atoms so autosave doesn't strip them.
export const FigureExtension = Node.create({
  name: "figure",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      html: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => ({
          html: (element as HTMLElement).innerHTML,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return ["figure", { "data-raw": node.attrs.html }];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("figure");
      dom.innerHTML = node.attrs.html;
      dom.contentEditable = "false";
      return { dom };
    };
  },
});

// Use instead of editor.getHTML() — restores raw figure HTML that renderHTML encodes into data-raw.
export function getEditorHTML(editor: { getHTML: () => string }): string {
  const html = editor.getHTML();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("figure[data-raw]").forEach((fig) => {
    const raw = fig.getAttribute("data-raw") ?? "";
    const wrapper = document.createElement("figure");
    wrapper.innerHTML = raw;
    fig.replaceWith(wrapper);
  });
  return doc.body.innerHTML;
}
