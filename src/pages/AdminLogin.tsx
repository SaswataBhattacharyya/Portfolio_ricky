import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LockKeyhole, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { BrandMark } from "@/components/brand/BrandMark";
import { loginAdmin } from "@/lib/adminPreviewSession";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await loginAdmin(email, password);
      const returnTo = new URLSearchParams(location.search).get("returnTo");
      navigate(returnTo || "/admin");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="section-padding flex min-h-screen items-center justify-center pb-16 pt-32">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Link>

          <div className="glass-card p-8 md:p-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <div className="mb-5 inline-flex h-12 items-center rounded-xl bg-gradient-primary px-4 text-xl">
                  <BrandMark variant="compact" className="text-primary-foreground" />
                </div>
                <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">
                  Private area
                </p>
                <h1 className="text-3xl font-bold text-foreground">Admin login</h1>
              </div>
              <LockKeyhole className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-2">
                <label htmlFor="admin-email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="admin-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter password"
                />
              </div>

              {errorMessage && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-primary px-6 py-4 font-semibold text-primary-foreground glow-sm transition-opacity hover:opacity-90"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn className="h-5 w-5" />
                {isSubmitting ? "Signing in..." : "Enter Admin Hub"}
              </motion.button>
            </form>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
