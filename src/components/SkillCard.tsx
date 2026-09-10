import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface SkillCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
  to?: string;
}

export function SkillCard({ icon: Icon, title, description, index, to }: SkillCardProps) {
  const content = (
    <>
      <div className="glass-card p-8 h-full transition-all duration-300 group-hover:glow-sm">
        <motion.div
          className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6"
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-7 h-7 text-primary-foreground" />
        </motion.div>

        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-gradient transition-colors">
          {title}
        </h3>

        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Hover gradient border effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl border-gradient" />
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -8 }}
      className="group relative"
    >
      {to ? (
        <Link
          to={to}
          className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}
