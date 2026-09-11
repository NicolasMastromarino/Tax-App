"use client";

import { useActionState, useState } from "react";
import { Input, Textarea, Label, FieldError, HelpText } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          rows={20}
          defaultValue={initial?.content}
          className="font-mono text-sm"
          required
        />
        <HelpText>
          Markdown: **bold**, [link text](https://example.com), ## Heading, ### Smaller heading,
          &ldquo;- item&rdquo; for a bulleted list, &ldquo;1. item&rdquo; for a numbered list,
          and{" "}
          ![alt text](/blog/your-image.jpg) for an image (put the file in the project&apos;s
          public/blog folder first).
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
