import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Heart } from "lucide-react";

export interface PreviewProject {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  tag: string | null;
  image_url: string | null;
  video_url: string | null;
  live_url: string | null;
  likes_count: number;
  niche_name?: string | null;
}

const LIKED_KEY = "liked_project_ids";

function readLiked(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function SamplePreviewDialog({
  project,
  onClose,
}: {
  project: PreviewProject | null;
  onClose: () => void;
}) {
  const [likes, setLikes] = useState(project?.likes_count ?? 0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!project) return;
    setLikes(project.likes_count);
    setLiked(readLiked().has(project.id));
  }, [project]);

  async function like() {
    if (!project || liked) return;
    setLiked(true);
    setLikes((n) => n + 1);
    const set = readLiked();
    set.add(project.id);
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(set)));
    const { error } = await supabase.rpc("increment_project_likes", { p_project_id: project.id });
    if (error) {
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
    }
  }

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        {project && (
          <>
            <div className="relative bg-black">
              {project.video_url ? (
                <video
                  src={project.video_url}
                  poster={project.image_url ?? undefined}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="max-h-[60vh] w-full object-contain"
                />
              ) : project.image_url ? (
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="max-h-[60vh] w-full object-contain"
                />
              ) : (
                <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-display font-bold">
                  {project.title}
                </div>
              )}
            </div>
            <div className="space-y-3 p-6 pt-4">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  {project.niche_name && <Badge>{project.niche_name}</Badge>}
                  {project.category && (
                    <p className="text-xs uppercase tracking-widest text-primary">
                      {project.category}
                    </p>
                  )}
                  {project.tag && <Badge variant="outline">{project.tag}</Badge>}
                </div>
                <DialogTitle className="text-2xl">{project.title}</DialogTitle>
                {project.description && (
                  <DialogDescription className="text-base">{project.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant={liked ? "default" : "outline"}
                  size="sm"
                  onClick={like}
                  className="hover-scale"
                >
                  <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes}
                </Button>
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="hover-scale">
                      Visit site <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
