"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  value: string;
  onChange: (url: string) => void;
  slug: string;
};

export default function ImageUploadField({ value, onChange, slug }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(file: File | null) {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeSlug = slug || `peptide-${Date.now()}`;
      const filePath = `${safeSlug}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("peptide-images")
        .upload(filePath, file, {
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from("peptide-images")
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Upload image</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          className="w-full rounded-md border px-3 py-2"
        />
      </label>

      {uploading ? (
        <p className="text-sm text-[var(--color-muted)]">Uploading image...</p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {value ? (
        <div className="rounded-xl border p-3">
          <p className="mb-2 text-sm font-medium">Current image preview</p>
          <img
            src={value}
            alt="Peptide preview"
            className="h-40 w-full rounded-lg object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}