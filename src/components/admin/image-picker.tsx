"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BLOG_IMAGE_CONTENT_TYPES, MAX_BLOG_IMAGE_BYTES } from "@/lib/media";
import { listBlogImagesAction, deleteBlogImageAction, type MediaImage } from "@/lib/actions/media-actions";

/**
 * Shared "browse or upload an image" modal used by both the featured-image
 * field (post-form.tsx) and the rich-text editor's image button
 * (rich-text-editor.tsx). Uploads go straight from the browser to Vercel
 * Blob (see src/app/api/blog/upload/route.ts), and the library is just a
 * live listing of that store -- there's no separate database of uploads.
 */
export function ImagePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Choose an image"
      description="Pick one you've already uploaded, or upload a new one."
      className="max-w-3xl"
    >
      {/* Mounted fresh every time the dialog opens, so its state (the
          fetched list, any error, the URL-paste toggle) never needs a
          manual reset -- there's simply no previous instance to reset. */}
      {open && <ImagePickerContent onClose={onClose} onSelect={onSelect} />}
    </Dialog>
  );
}

function ImagePickerContent({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [images, setImages] = useState<MediaImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listBlogImagesAction()
      .then(setImages)
      .catch(() => setError("Couldn't load your uploaded images."));
  }, []);

  function choose(url: string) {
    onSelect(url);
    onClose();
  }

  async function handleFile(file: File) {
    setError(null);
    if (!BLOG_IMAGE_CONTENT_TYPES.includes(file.type as (typeof BLOG_IMAGE_CONTENT_TYPES)[number])) {
      setError("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_BLOG_IMAGE_BYTES) {
      setError(`That image is larger than ${Math.round(MAX_BLOG_IMAGE_BYTES / (1024 * 1024))}MB -- resize it and try again.`);
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(`blog/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/blog/upload",
      });
      setImages((prev) => [
        { url: blob.url, pathname: blob.pathname, uploadedAt: new Date().toISOString(), size: file.size },
        ...(prev ?? []),
      ]);
      choose(blob.url);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(image: MediaImage) {
    if (
      !confirm(
        "Delete this image? This can't be undone, and any post still using it will show a broken image."
      )
    ) {
      return;
    }
    startDeleteTransition(async () => {
      try {
        await deleteBlogImageAction(image.url);
        setImages((prev) => prev?.filter((img) => img.url !== image.url) ?? null);
      } catch {
        setError("Couldn't delete that image.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={BLOG_IMAGE_CONTENT_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload new image"}
        </Button>
        <button
          type="button"
          onClick={() => setShowUrlInput((s) => !s)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {showUrlInput ? "Cancel" : "Or paste an image URL"}
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && urlValue.trim()) {
                e.preventDefault();
                choose(urlValue.trim());
              }
            }}
            placeholder="https://example.com/image.jpg"
            className="h-8 flex-1 rounded border border-border bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => urlValue.trim() && choose(urlValue.trim())}
            className="h-8 rounded bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Use
          </button>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {images === null ? (
        <p className="text-sm text-muted">Loading your images...</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-muted">No images uploaded yet -- upload one above.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.url}
              className="group relative overflow-hidden rounded-lg border border-border"
            >
              <button type="button" onClick={() => choose(image.url)} className="block aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail of an arbitrary Blob-stored URL, not a static app asset */}
                <img
                  src={image.url}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(image)}
                disabled={isDeleting}
                aria-label="Delete image"
                className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
