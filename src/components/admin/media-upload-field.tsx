import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, Link2, Video as VideoIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** Storage path prefix, e.g. "avatars", "hero", "brands". */
  folder: string;
  accept?: string;
  label?: string;
  /** Show a small image/video preview above the controls. */
  preview?: boolean;
  /** Called once, only after a successful device upload (never while typing
   *  a pasted link). Wire this to persist immediately — otherwise "Uploaded"
   *  only updates in-memory form state and the admin still has to find and
   *  click a separate Save button before it actually shows up anywhere. */
  onUploaded?: (url: string) => void | Promise<void>;
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
}

/** URL field + "upload from device" button, backed by the public `media`
 *  Supabase Storage bucket. Either path ends the same way: `value` becomes a
 *  public URL, so every consumer (hero, avatar, brand logo, …) stays a plain
 *  string field in site_settings / the content tables. */
export function MediaUploadField({
  value,
  onChange,
  folder,
  accept = "image/*",
  label,
  preview = true,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isVideo = accept.startsWith("video");

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const path = `${folder}/${Date.now()}-${sanitize(file.name)}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
      if (onUploaded) {
        await onUploaded(data.publicUrl);
        toast.success("Uploaded and saved — live on the site now.");
      } else {
        toast.success("Uploaded — click Save below to publish it.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}
      {preview && value && (
        <div className="overflow-hidden rounded-lg border border-border/60 bg-black/20">
          {isVideo ? (
            <video
              src={value}
              className="h-32 w-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <img src={value} alt="" className="h-32 w-full object-cover" />
          )}
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Paste a link…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isVideo ? (
            <VideoIcon className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Upload</span>
        </Button>
      </div>
    </div>
  );
}
