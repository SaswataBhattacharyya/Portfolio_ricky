import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Maximize2, Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type MediaItem = {
  title: string;
  description: string;
  duration: string;
  sourcePath: string;
  videoUrl: string;
  posterUrl: string;
};

type MediaGalleryProps = {
  eyebrow: string;
  title: string;
  gradientWord: string;
  description: string;
  items: MediaItem[];
};

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: index * 0.12 },
  }),
};

const isCoarsePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none), (pointer: coarse)").matches;

function MediaCard({ item, index, onOpen }: { item: MediaItem; index: number; onOpen: (item: MediaItem) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const playPreview = async () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.currentTime = video.currentTime || 0;

    try {
      await video.play();
      setIsPreviewing(true);
    } catch {
      setIsPreviewing(false);
    }
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
    setIsPreviewing(false);
  };

  const toggleMobilePreview = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void playPreview();
      return;
    }

    stopPreview();
  };

  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8 }}
      role="button"
      tabIndex={0}
      onMouseEnter={() => {
        if (!isCoarsePointer()) void playPreview();
      }}
      onMouseMove={() => {
        if (!isCoarsePointer() && !isPreviewing) void playPreview();
      }}
      onPointerEnter={() => {
        if (!isCoarsePointer()) void playPreview();
      }}
      onPointerMove={() => {
        if (!isCoarsePointer() && !isPreviewing) void playPreview();
      }}
      onMouseLeave={stopPreview}
      onPointerLeave={stopPreview}
      onFocus={() => {
        if (!isCoarsePointer()) void playPreview();
      }}
      onBlur={stopPreview}
      onClick={() => {
        if (isCoarsePointer()) {
          toggleMobilePreview();
          return;
        }

        onOpen(item);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
      className="group glass-card overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="aspect-video bg-black overflow-hidden border-b border-border/50 relative">
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={item.posterUrl}
          muted
          playsInline
          preload="metadata"
          onMouseEnter={() => {
            if (!isCoarsePointer()) void playPreview();
          }}
          onMouseMove={() => {
            if (!isCoarsePointer() && !isPreviewing) void playPreview();
          }}
          onPointerEnter={() => {
            if (!isCoarsePointer()) void playPreview();
          }}
          onPointerMove={() => {
            if (!isCoarsePointer() && !isPreviewing) void playPreview();
          }}
          className="w-full h-full object-contain bg-black"
          aria-label={`${item.title} muted preview`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-80 pointer-events-none" />
        <div className="absolute left-4 bottom-4 flex items-center gap-2 text-primary-foreground">
          <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <span className="text-sm font-medium bg-background/80 text-foreground px-3 py-2 rounded-full backdrop-blur">
            {isPreviewing ? "Previewing" : item.duration}
          </span>
        </div>
      </div>

      <div className="p-7">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground group-hover:text-gradient transition-colors">
              {item.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">{item.sourcePath}</p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(item);
            }}
            className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Open ${item.title}`}
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        <p className="text-muted-foreground leading-relaxed">{item.description}</p>
      </div>
    </motion.article>
  );
}

function MediaModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close viewer" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-6xl glass-card overflow-hidden"
      >
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border/50">
          <div>
            <h2 className="text-xl font-bold text-foreground">{item.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{item.sourcePath}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <video
          src={item.videoUrl}
          poster={item.posterUrl}
          controls
          autoPlay
          muted
          playsInline
          className="w-full aspect-video bg-black"
        />
      </motion.div>
    </div>
  );
}

export default function MediaGallery({ eyebrow, title, gradientWord, description, items }: MediaGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="section-padding pt-32 pb-24">
        <section className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-12"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to portfolio
            </Link>

            <span className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block">{eyebrow}</span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {title} <span className="text-gradient">{gradientWord}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">{description}</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {items.map((item, index) => (
              <MediaCard key={item.videoUrl} item={item} index={index} onOpen={setSelectedItem} />
            ))}
          </div>
        </section>
      </main>
      <Footer />

      {selectedItem ? <MediaModal item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
    </div>
  );
}
