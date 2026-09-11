"use client";

export function DeletePostButton({ title }: { title: string }) {
  return (
    <button
      type="submit"
      className="text-sm font-medium text-danger hover:underline"
      onClick={(e) => {
        if (!confirm(`Delete "${title}"? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
