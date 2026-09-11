import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  BarChart3,
  Bell,
  ChevronDown,
  CircleDollarSign,
  FileText,
  LogOut,
  Mail,
  MessageSquareText,
  Phone,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Switch } from "@/components/ui/switch";
import {
  endAdminSession,
  getAdminSession,
} from "@/lib/adminPreviewSession";
import { apiFetch } from "@/lib/api";
import { enableAdminPush } from "@/lib/push";

type Overview = { totalGigs: number; thisMonth: number; visitors: number; animations: number; videos: number; websites: number; importedWebsites: number };
type Submission = { id: number; name: string; email: string; description: string; status: string; createdAt: string; budget: string; budgetUsd?: string; currency: string; duration: string };
type Settings = { smtpSenderEmail: string; receiverEmail: string; publicContactEmail: string; emailNotificationsEnabled: boolean; pushNotificationsEnabled: boolean };
type CmsItem = { id: string | number; title: string; description: string; kind?: string; url?: string; sourcePath?: string };

export default function AdminHub() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sort, setSort] = useState("recent");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [mediaItems, setMediaItems] = useState<CmsItem[]>([]);
  const [websiteItems, setWebsiteItems] = useState<CmsItem[]>([]);
  const [mediaKind, setMediaKind] = useState("animation");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPoster, setMediaPoster] = useState<File | null>(null);
  const [websiteTitle, setWebsiteTitle] = useState("");
  const [websiteDescription, setWebsiteDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteGitUrl, setWebsiteGitUrl] = useState("");

  useEffect(() => {
    getAdminSession()
      .then((session) => {
        if (!session.authenticated) {
          navigate("/admin/login", { replace: true });
          return;
        }
        setIsAuthenticated(true);
        return Promise.all([
          apiFetch<Overview>("/admin/overview/"),
          apiFetch<{ items: Submission[] }>(`/admin/submissions/?sort=${sort}`),
          apiFetch<Settings>("/admin/settings/"),
          apiFetch<{ items: CmsItem[] }>("/admin/media/"),
          apiFetch<{ items: CmsItem[] }>("/admin/websites/"),
        ]).then(([nextOverview, nextSubmissions, nextSettings, nextMedia, nextWebsites]) => {
          setOverview(nextOverview);
          setSubmissions(nextSubmissions.items);
          setSettings(nextSettings);
          setMediaItems(nextMedia.items);
          setWebsiteItems(nextWebsites.items);
        });
      })
      .catch(() => navigate("/admin/login", { replace: true }));
  }, [navigate, sort]);

  const handleSignOut = () => {
    void endAdminSession().finally(() => navigate("/", { replace: true }));
  };

  const saveSettings = async (next: Partial<Settings>) => {
    if (!settings) return;
    const merged = { ...settings, ...next };
    setSettings(merged);
    try {
      await apiFetch("/admin/settings/", { method: "PATCH", body: JSON.stringify({
        smtp_sender_email: merged.smtpSenderEmail,
        receiver_email: merged.receiverEmail,
        public_contact_email: merged.publicContactEmail,
        email_notifications_enabled: merged.emailNotificationsEnabled,
        push_notifications_enabled: merged.pushNotificationsEnabled,
      }) });
      setSaveMessage("Saved");
      window.setTimeout(() => setSaveMessage(""), 1800);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save");
    }
  };

  const registerPush = async () => {
    setPushMessage("Preparing...");
    try {
      await enableAdminPush();
      setPushMessage("Notifications enabled on this device");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Could not enable notifications");
    }
  };

  const addMedia = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mediaFile || !mediaPoster || !mediaTitle.trim()) return;
    const form = new FormData();
    form.append("kind", mediaKind);
    form.append("title", mediaTitle);
    form.append("description", mediaDescription);
    form.append("video", mediaFile);
    form.append("poster", mediaPoster);
    try {
      const result = await apiFetch<{ item: CmsItem }>("/admin/media/", { method: "POST", body: form });
      setMediaItems((items) => [...items, result.item]);
      setMediaTitle(""); setMediaDescription(""); setMediaFile(null); setMediaPoster(null);
      setSaveMessage("Media added");
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : "Media could not be added"); }
  };

  const addWebsite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!websiteTitle.trim()) return;
    try {
      const result = await apiFetch<{ item: CmsItem }>(websiteGitUrl ? "/admin/git-import/" : "/admin/websites/", {
        method: "POST",
        body: JSON.stringify({ title: websiteTitle, description: websiteDescription, url: websiteUrl, gitUrl: websiteGitUrl }),
      });
      setWebsiteItems((items) => [...items, result.item]);
      setWebsiteTitle(""); setWebsiteDescription(""); setWebsiteUrl(""); setWebsiteGitUrl("");
      setSaveMessage("Website added");
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : "Website could not be added"); }
  };

  const deleteMedia = async (id: string | number) => {
    await apiFetch(`/admin/media/${id}/`, { method: "DELETE" });
    setMediaItems((items) => items.filter((item) => item.id !== id));
  };

  const deleteWebsite = async (id: string | number) => {
    await apiFetch(`/admin/websites/${id}/`, { method: "DELETE" });
    setWebsiteItems((items) => items.filter((item) => item.id !== id));
  };

  const updateSubmission = async (id: number, status: string) => {
    await apiFetch(`/admin/submissions/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) });
    setSubmissions((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  };

  const deleteSubmission = async (id: number) => {
    await apiFetch(`/admin/submissions/${id}/`, { method: "DELETE" });
    setSubmissions((items) => items.filter((item) => item.id !== id));
  };

  if (!isAuthenticated || !overview || !settings) return null;

  const statCards = [
    { label: "Total gigs", value: String(overview.totalGigs), detail: overview.totalGigs ? "Stored submissions" : "No submissions yet", icon: FileText },
    { label: "This month", value: String(overview.thisMonth), detail: "New opportunities", icon: BarChart3 },
    { label: "Visitors", value: String(overview.visitors), detail: "Site Analytics", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="section-padding pb-24 pt-32">
        <div className="mx-auto max-w-7xl">
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
                Private workspace
              </p>
              <h1 className="text-4xl font-bold text-foreground md:text-5xl">
                Admin <span className="text-gradient">Hub</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Keep an eye on incoming opportunities, notification preferences, and portfolio
                activity.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground md:self-auto"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.header>

          <section aria-label="Overview" className="mb-8 grid gap-5 md:grid-cols-3">
            {statCards.map((stat, index) => (
              <motion.article
                key={stat.label}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="glass-card p-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="mt-2 text-sm text-muted-foreground">{stat.detail}</p>
              </motion.article>
            ))}
          </section>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
            <section className="glass-card overflow-hidden" aria-labelledby="gigs-heading">
              <div className="flex flex-col gap-4 border-b border-border/60 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="h-5 w-5 text-primary" />
                    <h2 id="gigs-heading" className="text-2xl font-bold text-foreground">
                      Incoming gigs
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Review, sort, and manage customer submissions.
                  </p>
                </div>
                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Sort by</span>
                  <select
                    aria-label="Sort gigs"
                    className="rounded-lg border border-border bg-secondary px-3 py-2 text-foreground outline-none focus:border-primary"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="recent">Most recent</option>
                    <option value="earliest">Earliest</option>
                    <option value="budget">Highest budget</option>
                    <option value="timeline">Longest timeline</option>
                  </select>
                </label>
              </div>

              <div className="p-6">
                {submissions.length === 0 ? <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
                  <CircleDollarSign className="mx-auto mb-4 h-9 w-9 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">No gigs yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    New customer submissions will appear here with their budget, timeline, and
                    project details.
                  </p>
                </div> : <div className="grid gap-3">
                  {submissions.map((submission) => (
                    <article key={submission.id} className="rounded-xl border border-border bg-secondary/40 p-4">
                      <button type="button" onClick={() => setExpanded(expanded === submission.id ? null : submission.id)} className="flex w-full items-center justify-between gap-4 text-left">
                        <span><span className="block font-medium text-foreground">{submission.name}</span><span className="block text-xs text-muted-foreground">{submission.email} · {submission.status}</span></span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {expanded === submission.id && <div className="mt-4 border-t border-border/60 pt-4 text-sm text-muted-foreground"><p>{submission.description}</p><p className="mt-2">{submission.budget} {submission.currency} · {submission.duration}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void updateSubmission(submission.id, "reviewed")} className="rounded-lg border border-border px-3 py-2 text-xs hover:border-primary">Mark reviewed</button><button type="button" onClick={() => void updateSubmission(submission.id, "archived")} className="rounded-lg border border-border px-3 py-2 text-xs hover:border-primary">Archive</button><button type="button" onClick={() => void deleteSubmission(submission.id)} className="rounded-lg border border-border px-3 py-2 text-xs text-destructive hover:border-destructive">Delete</button></div></div>}
                    </article>
                  ))}
                </div>}
              </div>
            </section>

            <aside className="grid gap-8">
              <section className="glass-card p-6" aria-labelledby="notifications-heading">
                <div className="mb-6 flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <h2 id="notifications-heading" className="text-xl font-bold text-foreground">
                    Notifications
                  </h2>
                </div>

                <div className="grid gap-5">
                  <label className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="block text-sm font-medium text-foreground">Email alerts</span>
                        <span className="block text-xs text-muted-foreground">New gig submissions</span>
                      </span>
                    </span>
                    <Switch checked={settings.emailNotificationsEnabled} onCheckedChange={(checked) => void saveSettings({ emailNotificationsEnabled: checked })} />
                  </label>

                  <label className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="block text-sm font-medium text-foreground">Phone push</span>
                        <span className="block text-xs text-muted-foreground">Installed web app</span>
                      </span>
                    </span>
                    <Switch checked={settings.pushNotificationsEnabled} onCheckedChange={(checked) => void saveSettings({ pushNotificationsEnabled: checked })} />
                  </label>

                  <div className="grid gap-2 border-t border-border/60 pt-5">
                    <label htmlFor="smtp-sender-email" className="text-sm font-medium text-foreground">
                      Gmail sender email
                    </label>
                    <input
                      id="smtp-sender-email"
                      type="email"
                      value={settings.smtpSenderEmail}
                      onChange={(event) => setSettings({ ...settings, smtpSenderEmail: event.target.value })}
                      onBlur={() => void saveSettings({ smtpSenderEmail: settings.smtpSenderEmail })}
                      placeholder="Gmail account that sends notifications"
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                      Gig receiver email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={settings.receiverEmail}
                      onChange={(event) => setSettings({ ...settings, receiverEmail: event.target.value })}
                      onBlur={() => void saveSettings({ receiverEmail: settings.receiverEmail })}
                      placeholder="Where new gigs should arrive"
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <label htmlFor="public-contact-email" className="text-sm font-medium text-foreground">
                      Public contact email
                    </label>
                    <input
                      id="public-contact-email"
                      type="email"
                      value={settings.publicContactEmail}
                      onChange={(event) => setSettings({ ...settings, publicContactEmail: event.target.value })}
                      onBlur={() => void saveSettings({ publicContactEmail: settings.publicContactEmail })}
                      placeholder="Email shown to visitors"
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button type="button" onClick={() => void registerPush()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                    <Phone className="h-4 w-4" />
                    Enable notifications on this device
                  </button>
                  {pushMessage && <p role="status" className="text-xs text-muted-foreground">{pushMessage}</p>}
                </div>
              </section>

              <section className="glass-card p-6" aria-labelledby="analytics-heading">
                <div className="mb-5 flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <h2 id="analytics-heading" className="text-xl font-bold text-foreground">
                    Activity
                  </h2>
                </div>
                <div className="flex items-start gap-4 rounded-xl bg-secondary/70 p-4">
                  <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Site Analytics</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Visitor and route activity is collected privately by Webberick.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          <section className="mt-8 grid gap-8 xl:grid-cols-2" aria-label="Portfolio management">
            <section className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground">Add animation or video</h2>
              <form onSubmit={addMedia} className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input value={mediaTitle} onChange={(event) => setMediaTitle(event.target.value)} required placeholder="Title" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                  <select value={mediaKind} onChange={(event) => setMediaKind(event.target.value)} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-primary"><option value="animation">Animation</option><option value="video">Video</option></select>
                </div>
                <textarea value={mediaDescription} onChange={(event) => setMediaDescription(event.target.value)} placeholder="Description" className="min-h-24 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                <input type="file" accept="video/webm,video/mp4,video/quicktime" onChange={(event) => setMediaFile(event.target.files?.[0] || null)} required className="w-full text-sm text-muted-foreground" />
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setMediaPoster(event.target.files?.[0] || null)} required className="w-full text-sm text-muted-foreground" aria-label="Template image" />
                <button type="submit" className="rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Add media</button>
              </form>
              <div className="mt-6 grid gap-2">{mediaItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"><span className="text-foreground">{item.title}</span><span className="flex items-center gap-3"><span className="text-xs capitalize text-muted-foreground">{item.kind}</span><button type="button" aria-label={`Delete ${item.title}`} onClick={() => void deleteMedia(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></span></div>)}</div>
            </section>
            <section className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground">Add website</h2>
              <form onSubmit={addWebsite} className="mt-5 grid gap-4">
                <input value={websiteTitle} onChange={(event) => setWebsiteTitle(event.target.value)} required placeholder="Project title" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                <textarea value={websiteDescription} onChange={(event) => setWebsiteDescription(event.target.value)} placeholder="Description" className="min-h-24 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                <input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} type="url" placeholder="Production URL (optional)" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                <input value={websiteGitUrl} onChange={(event) => setWebsiteGitUrl(event.target.value)} type="url" placeholder="HTTPS Git URL (optional)" className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                <button type="submit" className="rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Add website</button>
              </form>
              <div className="mt-6 grid gap-2">{websiteItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"><span><span className="block text-foreground">{item.title}</span><span className="text-xs text-muted-foreground">{item.url || item.sourcePath || "Imported website"}</span></span><button type="button" aria-label={`Delete ${item.title}`} onClick={() => void deleteWebsite(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>)}</div>
            </section>
          </section>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {saveMessage && <span role="status" className="text-primary">{saveMessage}</span>}
            <Link to="/" className="inline-flex items-center gap-2 hover:text-foreground">
              <Archive className="h-4 w-4" />
              Return to portfolio
            </Link>
            <button type="button" className="inline-flex items-center gap-2 hover:text-foreground">
              <Trash2 className="h-4 w-4" />
              Manage archived gigs
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
