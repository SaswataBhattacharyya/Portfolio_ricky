import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("hero");
          }}
          className="text-xl font-bold text-gradient"
          whileHover={{ scale: 1.05 }}
        >
          Portfolio
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
  );
}
