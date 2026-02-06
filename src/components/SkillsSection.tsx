import { motion } from "framer-motion";
import { SkillCard } from "./SkillCard";
import { Palette, Code, Video, Sparkles } from "lucide-react";

const skills = [
  {
    icon: Sparkles,
    title: "Animation",
    description:
      "Creating captivating motion graphics and micro-interactions that bring interfaces to life and enhance user engagement.",
  },
  {
    icon: Code,
    title: "Web Development",
    description:
      "Full-stack expertise in modern frameworks. From pixel-perfect frontends to robust, scalable backend architectures.",
  },
  {
    icon: Video,
    title: "Video Production",
    description:
      "End-to-end video creation including AI-generated content, professional editing, and motion graphics for all platforms.",
  },
];

export function SkillsSection() {
  return (
    <section id="skills" className="py-32 section-padding relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block"
          >
            What I Do
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Creative <span className="text-gradient">Services</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transforming ideas into digital reality with a blend of creativity and technical precision.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {skills.map((skill, index) => (
            <SkillCard
              key={skill.title}
              icon={skill.icon}
              title={skill.title}
              description={skill.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
