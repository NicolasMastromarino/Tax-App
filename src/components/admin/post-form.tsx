"use client";

import { useActionState, useState } from "react";
import { Input, Textarea, Select, Label, FieldError, HelpText } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImagePicker } from "@/components/admin/image-picker";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";
import type { BlogActionState } from "@/lib/actions/blog-actions";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type PostFormValues = {
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string | null;
  featuredImage: string;
  published: boolean;
};

export function PostForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prevState: BlogActionState, formData: FormData) => Promise<BlogActionState>;
  initial?: PostFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<BlogActionState, FormData>(action, {});
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [content, setContent] = useState(initial?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [featuredImageBroken, setFeaturedImageBroken] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
        />
        <FieldError>{state.fieldErrors?.title}</FieldError>
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          required
        />
        <HelpText>bookkeeply.me/blog/{slug || "your-post-slug"}</HelpText>
        <FieldError>{state.fieldErrors?.slug}</FieldError>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initial?.description}
          placeholder="One sentence shown on the blog index and in search results."
        />
        <FieldError>{state.fieldErrors?.description}</FieldError>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select id="category" name="category" defaultValue={initial?.category ?? ""}>
          <option value="">No category</option>
          {BLOG_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <HelpText>Shown as a small tag next to the date on the blog index.</HelpText>
        <FieldError>{state.fieldErrors?.category}</FieldError>
      </div>

      <div>
        <Label htmlFor="featuredImage">Featured image</Label>
        <div className="flex gap-2">
          <Input
            id="featuredImage"
            name="featuredImage"
            value={featuredImage}
            onChange={(e) => {
              setFeaturedImage(e.target.value);
              setFeaturedImageBroken(false);
            }}
            placeholder="/blog/your-image.jpg"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={() => setImagePickerOpen(true)}>
            Browse
          </Button>
        </div>
        <HelpText>
          Upload a new image or pick one you&apos;ve used before, or paste a path/URL directly.
          Shown on the blog index card and at the top of the post. Leave blank for none.
        </HelpText>
        <ImagePicker
          open={imagePickerOpen}
          onClose={() => setImagePickerOpen(false)}
          onSelect={(url) => {
            setFeaturedImage(url);
            setFeaturedImageBroken(false);
          }}
        />
        {featuredImage.trim() && !featuredImageBroken && (
          // eslint-disable-next-line @next/next/no-img-element -- admin-entered path/URL, not a static app asset
          <img
            src={featuredImage.trim()}
            alt=""
            onError={() => setFeaturedImageBroken(true)}
            className="mt-2 h-32 w-full max-w-sm rounded-lg border border-border object-cover"
          />
        )}
        {featuredImage.trim() && featuredImageBroken && (
          <p className="mt-2 text-xs text-danger">Couldn&apos;t load an image from that path.</p>
        )}
        <FieldError>{state.fieldErrors?.featuredImage}</FieldError>
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <RichTextEditor value={content} onChange={setContent} placeholder="Write your post..." />
        <input type="hidden" name="content" value={content} />
        <HelpText>
          Use the toolbar for headings, bold/italic, lists, quotes, links, images (upload, browse
          images you&apos;ve used before, or paste a URL), and tables, the grid icon lets you pick
          a size before inserting a table with a header row; put your cursor in a cell and use Tab
          to add more rows. The calculator icon inserts a boxed callout for a number or
          calculation worth setting apart; the info icon inserts the standard tax-disclaimer block
          (divider + icon) pre-filled with the usual wording -- edit it in place if a post needs
          different phrasing.
        </HelpText>
        <FieldError>{state.fieldErrors?.content}</FieldError>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="published"
          name="published"
          type="checkbox"
          defaultChecked={initial?.published ?? false}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="published" className="mb-0">
          Published (visible on /blog)
        </Label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
