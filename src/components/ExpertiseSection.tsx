import { motion } from "framer-motion";
import { SkillCard } from "./SkillCard";
import { Database, Dna, Brain } from "lucide-react";

const expertise = [
  {
    icon: Database,
    title: "Data Science",
    description:
      "Advanced analytics, machine learning pipelines, and data visualization that transform raw data into actionable insights.",
  },
  {
    icon: Dna,
    title: "Bioinformatics",
    description:
      "Computational biology expertise including genomic analysis, protein structure prediction, and biological data modeling.",
  },
  {
    icon: Brain,
    title: "AI Design",
    description:
      "Designing intelligent systems and neural network architectures that solve complex problems with elegant solutions.",
  },
];

export function ExpertiseSection() {
  return (
    <section id="expertise" className="py-32 section-padding relative bg-surface-elevated">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-accent/10 blur-3xl"
          animate={{
            y: [0, 20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-primary/10 blur-3xl"
          animate={{
            y: [0, -20, 0],
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
            Technical Expertise
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Advanced <span className="text-gradient">Capabilities</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deep technical knowledge in cutting-edge fields that drive innovation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {expertise.map((item, index) => (
            <SkillCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
