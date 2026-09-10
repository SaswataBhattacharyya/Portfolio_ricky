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

export default function VideoProduction() {
  const { data } = useQuery({
    queryKey: ["portfolio-media", "video"],
    queryFn: async () => (await apiFetch<{ items: MediaItem[] }>("/portfolio/media/?kind=video")).items,
    staleTime: 60_000,
    retry: false,
  });
  const videoItems = data ?? [];

  return (
    <MediaGallery
      eyebrow="Video Production"
      title="Video"
      gradientWord="Templates"
      description="Muted previews of video production work. Hover a card to play it inline, or open a larger viewer with controls."
      items={videoItems}
    />
  );
}
