import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { BrandMark } from "./brand/BrandMark";
import { AdminEntryAnimation } from "./AdminEntryAnimation";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const clickCount = useRef(0);
  const clickResetTimer = useRef<number | null>(null);
  const [showAdminEntry, setShowAdminEntry] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) {
      return;
    }

    requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    });
  }, [location]);

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
      return;
    }

    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBrandClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    clickCount.current += 1;

    if (clickResetTimer.current !== null) {
      window.clearTimeout(clickResetTimer.current);
    }

    if (clickCount.current === 3) {
      clickCount.current = 0;
      setShowAdminEntry(true);
      return;
    }

    clickResetTimer.current = window.setTimeout(() => {
      clickCount.current = 0;
    }, 700);

    scrollToSection("hero");
  };

  useEffect(() => {
    return () => {
      if (clickResetTimer.current !== null) {
        window.clearTimeout(clickResetTimer.current);
      }
    };
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a
            href="#hero"
            aria-label="Webberick"
            onClick={handleBrandClick}
            className="text-xl font-bold"
            whileHover={{ scale: 1.05 }}
          >
            <BrandMark variant="compact" cursorBlink />
          </motion.a>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
              {["skills", "expertise", "contact"].map((section) => (
                <motion.button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors capitalize"
                  whileHover={{ y: -2 }}
                >
                  {section}
                </motion.button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>
      {showAdminEntry && (
        <AdminEntryAnimation
          onComplete={() => {
            setShowAdminEntry(false);
            navigate("/admin/login");
          }}
        />
      )}
    </>
  );
}
