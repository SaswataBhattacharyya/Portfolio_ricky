import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, FolderCode, Globe } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { apiFetch } from "@/lib/api";

const localEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  sourcePath: z.string().optional(),
  previewImage: z.string(),
});

const deployedEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  previewImage: z.string(),
});

const registrySchema = z.object({
  local: z.array(z.unknown()).optional(),
  deployed: z.array(z.unknown()).optional(),
});

type LocalEntry = z.infer<typeof localEntrySchema>;
type DeployedEntry = z.infer<typeof deployedEntrySchema>;

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: index * 0.12 },
  }),
};

async function isReachable(url: string): Promise<boolean> {
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store" });
    return true;
  } catch {
    return false;
  }
}

type Reachability = "checking" | "running" | "offline";

function useReachability(url: string): Reachability {
  const [status, setStatus] = useState<Reachability>("checking");

  const check = useCallback(async () => {
    setStatus("checking");
    const reachable = await isReachable(url);
    setStatus(reachable ? "running" : "offline");
  }, [url]);

  useEffect(() => {
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [check]);

  return status;
}

function StatusBadge({ status }: { status: Reachability }) {
  if (status === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
        Checking…
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500">
      <span className="w-2 h-2 rounded-full bg-amber-500" />
      Offline
    </span>
  );
}

function LocalCard({ entry, index }: { entry: LocalEntry; index: number }) {
  const status = useReachability(entry.url);
  return (
    <motion.a
      key={entry.id}
      href={entry.url}
      target="_blank"
      rel="noreferrer"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8 }}
      className="group glass-card overflow-hidden block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="aspect-[16/10] bg-secondary overflow-hidden border-b border-border/50">
        <img
          src={entry.previewImage}
          alt={`${entry.title} homepage preview`}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="p-7">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground group-hover:text-gradient transition-colors">
              {entry.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <FolderCode className="w-4 h-4" />
              <span>{entry.sourcePath ?? entry.id}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ExternalLink className="w-5 h-5" />
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-5">{entry.description}</p>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-primary">{entry.url}</div>
          <StatusBadge status={status} />
        </div>
        {status === "offline" && (
          <p className="text-xs text-muted-foreground mt-3">
            Start it with <code className="text-foreground">npm run templates</code>
          </p>
        )}
      </div>
    </motion.a>
  );
}

function DeployedCard({ entry, index }: { entry: DeployedEntry; index: number }) {
  return (
    <motion.a
      key={entry.id}
      href={entry.url}
      target="_blank"
      rel="noreferrer"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8 }}
      className="group glass-card overflow-hidden block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="aspect-[16/10] bg-secondary overflow-hidden border-b border-border/50">
        <img
          src={entry.previewImage}
          alt={`${entry.title} homepage preview`}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="p-7">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground group-hover:text-gradient transition-colors">
              {entry.title}
            </h2>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-primary">
              <Globe className="w-3.5 h-3.5" />
              Live site
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ExternalLink className="w-5 h-5" />
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-5">{entry.description}</p>
        <div className="text-sm font-medium text-primary">{entry.url}</div>
      </div>
    </motion.a>
  );
}

function LoadingCards() {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {[0, 1].map((i) => (
        <div key={i} className="glass-card overflow-hidden animate-pulse">
          <div className="aspect-[16/10] bg-secondary" />
          <div className="p-7 space-y-3">
            <div className="h-6 w-1/2 rounded bg-secondary" />
            <div className="h-4 w-1/3 rounded bg-secondary" />
            <div className="h-4 w-full rounded bg-secondary" />
            <div className="h-4 w-2/3 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WebDevelopment() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["templates-registry"],
    queryFn: async () => {
      try {
        const response = await apiFetch<{ items: Array<Record<string, unknown>> }>("/portfolio/websites/");
        if (response.items.length) {
          return {
            local: response.items.filter((entry) => entry.kind === "imported"),
            deployed: response.items.filter((entry) => entry.kind !== "imported"),
          };
        }
      } catch {
        // Static registry remains the local fallback until the backend is populated.
      }
      const res = await fetch("/templates.json");
      if (!res.ok) throw new Error(`Failed to fetch templates.json (${res.status})`);
      return res.json();
    },
    staleTime: Infinity,
    retry: false,
  });

  const warnedRef = useRef(false);
  useEffect(() => {
    if (error && !warnedRef.current) {
      warnedRef.current = true;
      console.warn("[templates] no registry available", error);
    }
  }, [error]);

  const registry = (() => {
    if (!data) return null;
    const parsed = registrySchema.safeParse(data);
    if (!parsed.success) {
      console.warn("[templates] registry failed validation", parsed.error.issues);
      return null;
    }
    return parsed.data;
  })();

  const localEntries = (registry?.local ?? []).filter((entry): entry is LocalEntry => {
    const result = localEntrySchema.safeParse(entry);
    if (!result.success) {
      const raw = entry as { id?: string; title?: string } | null | undefined;
      console.warn(
        "[templates] skipping invalid local entry",
        raw?.id ?? raw?.title ?? "unknown",
        result.error.issues
      );
      return false;
    }
    return true;
  });

  const deployedEntries = (registry?.deployed ?? []).filter((entry): entry is DeployedEntry => {
    const result = deployedEntrySchema.safeParse(entry);
    if (!result.success) {
      const raw = entry as { id?: string; title?: string } | null | undefined;
      console.warn(
        "[templates] skipping invalid deployed entry",
        raw?.id ?? raw?.title ?? "unknown",
        result.error.issues
      );
      return false;
    }
    return true;
  });

  const hasAny = localEntries.length > 0 || deployedEntries.length > 0;

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

            <span className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block">
              Web Development
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Website <span className="text-gradient">Templates</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Local development cards need their dev server running — start them all with{" "}
              <code className="text-foreground">npm run templates</code>. Deployed cards open the
              live site directly.
            </p>
          </motion.div>

          {isLoading ? (
            <LoadingCards />
          ) : !hasAny ? (
            <div className="glass-card p-10 text-center">
              <h2 className="text-2xl font-bold mb-3">No templates registered yet</h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Add entries to <code className="text-foreground">public/templates.json</code> to
                show your website templates here. Each local entry needs an{" "}
                <code className="text-foreground">id</code>, <code className="text-foreground">title</code>,{" "}
                <code className="text-foreground">description</code>, <code className="text-foreground">url</code>,{" "}
                <code className="text-foreground">previewImage</code>, and optionally a{" "}
                <code className="text-foreground">sourcePath</code>.
              </p>
            </div>
          ) : (
            <>
              {localEntries.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-2xl font-bold mb-8">Local development</h2>
                  <div className="grid lg:grid-cols-2 gap-8">
                    {localEntries.map((entry, index) => (
                      <LocalCard key={entry.id} entry={entry} index={index} />
                    ))}
                  </div>
                </div>
              )}

              {deployedEntries.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-8">Deployed</h2>
                  <div className="grid lg:grid-cols-2 gap-8">
                    {deployedEntries.map((entry, index) => (
                      <DeployedCard key={entry.id} entry={entry} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
