import MediaGallery from "./MediaGallery";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type MediaItem = {
  title: string;
  description: string;
  duration: string;
  sourcePath: string;
  videoUrl: string;
  posterUrl: string;
};

export default function Animation() {
  const { data } = useQuery({
    queryKey: ["portfolio-media", "animation"],
    queryFn: async () => (await apiFetch<{ items: MediaItem[] }>("/portfolio/media/?kind=animation")).items,
    staleTime: 60_000,
    retry: false,
  });
  const animationItems = data ?? [];

  return (
    <MediaGallery
      eyebrow="Animation"
      title="Motion"
      gradientWord="Templates"
      description="Muted previews of animation work. Hover a card to play it inline, or open a larger viewer with controls."
      items={animationItems}
    />
  );
}
