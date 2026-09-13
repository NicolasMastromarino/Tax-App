// Two custom TipTap block types specific to this blog, matching the
// "PostSlugPolish" design pass: a tinted/bordered Callout box for equations
// and numbers worth setting apart, and a Disclaimer block (divider + small
// info icon) for the standard tax-disclaimer paragraph. See
// claude/blog-content-guidelines.md for when to use each.
//
// Both render real markup on the public post page too -- the matching CSS
// lives in src/app/blog/[slug]/page.tsx's prose-content class list, keyed
// off the same `blog-callout` / `blog-disclaimer` class names used here.
// Inserted directly via editor.chain().insertContent({...}) from the
// toolbar (rich-text-editor.tsx) rather than as custom TipTap commands, so
// there's no need to extend TipTap's Commands type.
import { Node, mergeAttributes } from "@tiptap/core";

export const STANDARD_TAX_DISCLAIMER =
  "Tax information is provided for general educational purposes and is not tax, legal, or " +
  "accounting advice. Your actual tax liability depends on your individual circumstances. " +
  "Consider consulting a qualified tax professional for advice specific to your situation.";

// A small bordered/tinted box for a calculation or number that should stand
// out from the surrounding paragraphs (e.g. "$6,000 x 30% = $1,800"). Holds
// one or more short paragraphs -- one per line of the calculation.
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "callout", class: "blog-callout" }),
      0,
    ];
  },
});

// The divider + small info-icon treatment for the closing tax disclaimer.
// A single-paragraph textblock (like a specialized Heading) so there's
// exactly one line of disclaimer text per block.
export const Disclaimer = Node.create({
  name: "disclaimer",
  group: "block",
  content: "inline*",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="disclaimer"]', contentElement: "p" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "disclaimer", class: "blog-disclaimer" }),
      [
        "svg",
        {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
        },
        ["circle", { cx: "12", cy: "12", r: "10" }],
        ["line", { x1: "12", y1: "16", x2: "12", y2: "12" }],
        ["line", { x1: "12", y1: "8", x2: "12.01", y2: "8" }],
      ],
      ["p", 0],
    ];
  },
});
