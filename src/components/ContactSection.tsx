import { motion } from "framer-motion";
import { ContactForm } from "./ContactForm";
import { Mail, Rocket } from "lucide-react";

export function ContactSection() {
  return (
    <section id="contact" className="py-32 section-padding relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-8 glow"
          >
            <Rocket className="w-10 h-10 text-primary-foreground" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block"
          >
            Let's Collaborate
          </motion.span>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Have a <span className="text-gradient">Gig?</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Got a project in mind? Let's bring your vision to life. Fill out the form below and I'll get back to you soon.
          </p>
        </motion.div>

        <ContactForm />

        {/* Alternative contact */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            Prefer email? Reach me at{" "}
            <a
              href="mailto:hello@example.com"
              className="text-primary hover:underline"
            >
              hello@example.com
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
