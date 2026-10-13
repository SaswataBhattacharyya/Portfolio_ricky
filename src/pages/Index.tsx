import { FormEvent, type MouseEvent, type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { WebberickMascot, type WebberickMascotState } from "@/components/home/WebberickMascot";
import { apiFetch } from "@/lib/api";
import { AdminEntryAnimation } from "@/components/AdminEntryAnimation";
import { Link, useNavigate } from "react-router-dom";
import { initialInquiry, toSubmissionPayload, type InquiryForm } from "@/lib/inquiry";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

const sectionIds = ["work", "services", "why-webberick", "about", "faq", "contact"] as const;
type MascotPlacement = "hidden" | "hero" | "dock" | "process" | "contact";


function useHomepageStyles() {
  useLayoutEffect(() => {
    const existing = document.getElementById("webberick-homepage-css") as HTMLLinkElement | null;
    const stylesheet = existing ?? document.createElement("link");
    if (!existing) {
      stylesheet.id = "webberick-homepage-css";
      stylesheet.rel = "stylesheet";
      stylesheet.href = "/homepage.css";
      document.head.appendChild(stylesheet);
    }

    const fontId = "webberick-homepage-fonts";
    const existingFonts = document.getElementById(fontId) as HTMLLinkElement | null;
    const fonts = existingFonts ?? document.createElement("link");
    if (!existingFonts) {
      fonts.id = fontId;
      fonts.rel = "stylesheet";
      fonts.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Nunito:wght@400;500;600;700&display=swap";
      document.head.appendChild(fonts);
    }

    const previousTitle = document.title;
    document.title = "Webberick — Design · Development · Motion";

    return () => {
      if (!existing) stylesheet.remove();
      if (!existingFonts) fonts.remove();
      document.title = previousTitle;
    };
  }, []);
}

function useHomepageMotion() {
  useEffect(() => {
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const links = sectionIds.map((id) => document.querySelector<HTMLAnchorElement>(`[data-nav="${id}"]`));
    const rail = document.getElementById("navRail");
    const viewport = document.getElementById("navViewport");
    const indicator = document.getElementById("navIndicator");
    const topbar = document.querySelector<HTMLElement>(".topbar");

    if (!rail || !viewport || !indicator || !topbar) return;

    let active = -1;
    let ticking = false;

    const moveIndicator = (index: number, center = true) => {
      sections.forEach((section, i) => section.classList.toggle("is-current", i === index));

      if (index < 0 || !links[index]) {
        indicator.style.opacity = "0";
        links.forEach((link) => {
          link?.classList.remove("is-active");
          link?.removeAttribute("aria-current");
        });
        viewport.scrollTo({ left: 0, behavior: "auto" });
        return;
      }

      links.forEach((link, i) => {
        if (!link) return;
        const on = i === index;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });

      const link = links[index];
      if (!link) return;
      indicator.style.width = `${link.offsetWidth}px`;
      indicator.style.transform = `translate3d(${link.offsetLeft}px,0,0)`;
      indicator.style.opacity = "1";

      if (center && viewport.scrollWidth > viewport.clientWidth) {
        const target = link.offsetLeft - (viewport.clientWidth - link.offsetWidth) / 2;
        viewport.scrollTo({ left: Math.max(0, target), behavior: "auto" });
      }
    };

    const resolveActive = () => {
      ticking = false;
      const activationLine = topbar.getBoundingClientRect().height + 30;
      let next = -1;
      for (let i = 0; i < sections.length; i += 1) {
        if (sections[i].getBoundingClientRect().top <= activationLine) next = i;
        else break;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        next = sections.length - 1;
      }
      if (next !== active) {
        active = next;
        moveIndicator(active, true);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(resolveActive);
      }
    };

    const onResize = () => {
      requestAnimationFrame(() => {
        moveIndicator(active, false);
        resolveActive();
      });
    };

    const linkHandlers = links.map((link, index) => {
      const handler = () => {
        active = index;
        moveIndicator(active, false);
      };
      link?.addEventListener("click", handler);
      return { link, handler };
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-seen");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px" },
    );

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

    let resizeObserver: ResizeObserver | undefined;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => moveIndicator(active, false));
      resizeObserver.observe(rail);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    resolveActive();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      linkHandlers.forEach(({ link, handler }) => link?.removeEventListener("click", handler));
      observer.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);
}

function useMascotPlacement(mascotRef: RefObject<HTMLElement>) {
  const [placement, setPlacement] = useState<MascotPlacement>("hidden");

  useLayoutEffect(() => {
    const element = mascotRef.current;
    const body = element?.querySelector<HTMLElement>(".mascot-jump-body");
    const topbar = document.querySelector<HTMLElement>(".topbar");
    const mark = document.querySelector<HTMLElement>(".wordmark");
    if (!element || !body || !topbar || !mark) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current: MascotPlacement = "hidden";
    let entered = false;
    let ready = !document.querySelector('[aria-label="Loading Webberick"]');
    let intent = false;
    let baseline = window.scrollY;
    let frame = 0;
    let flight: gsap.core.Timeline | null = null;
    let heroEntrance: gsap.core.Timeline | null = null;
    const titles = Array.from(document.querySelectorAll<HTMLElement>("#hero .hero-charge"));
    // Prepare before paint so complete words cannot flash ahead of their entrance.
    if (!reduced.matches) {
      titles.forEach((title) => title.classList.add("is-typing"));
      gsap.set(titles.flatMap((title) => Array.from(title.children)), { opacity: 0 });
    }
    const progress = { value: 0 };

    // The SVG has transparent padding. Track the visible character, not its square canvas.
    const target = (place: MascotPlacement) => {
      const host = document.querySelector<HTMLElement>(`.mascot-host--${place}`)!;
      const rect = host.getBoundingClientRect();
      if (place === "dock") {
        const logo = mark.getBoundingClientRect();
        return { x: logo.right + 16, y: logo.top + logo.height / 2 - 23, width: 46 };
      }
      const width = rect.width;
      let y = rect.top;
      if (place === "hero") {
        const heroBottom = document.getElementById("hero")!.getBoundingClientRect().bottom;
        y = Math.min(y, heroBottom - 24 - width * 0.78);
      }
      return {
        x: Math.max(-width * 0.20 + 16, Math.min(rect.left, window.innerWidth - width * 0.79 - 16)),
        y, width,
      };
    };
    const choose = (): MascotPlacement => {
      const navBottom = topbar.getBoundingClientRect().bottom;
      for (const place of ["hero", "contact", "process"] as const) {
        const dest = target(place);
        const visibleTop = dest.y + dest.width * 0.21;
        const visibleBottom = dest.y + dest.width * 0.78;
        // Leave before the character touches the navbar; return only to a visible landing.
        const clearance = place === "hero" ? (current === "hero" ? 64 : 88) : (current === place ? 24 : 36);
        if (visibleTop > navBottom + clearance && visibleBottom < window.innerHeight - 16) return place;
      }
      return "dock";
    };
    const park = () => {
      if (current === "hidden") return;
      const dest = target(current);
      gsap.set(element, { x: dest.x, y: dest.y, width: dest.width });
    };
    const animateHero = () => {
      if (reduced.matches) return;
      heroEntrance = gsap.timeline({ onComplete: () => {
        titles.forEach((title) => title.classList.remove("is-typing"));
        gsap.set(titles.flatMap((title) => Array.from(title.children)), { clearProps: "transform,opacity" });
      } });
      // Keep the full word width reserved while letters enter, so the hero never reflows.
      titles.forEach((title, row) => {
        const letters = Array.from(title.querySelectorAll<HTMLElement>(".hero-letter"));
        const rollAt = 0.14 + row * 0.1;
        heroEntrance!.fromTo(letters[0], {
          x: -Math.min(460, window.innerWidth * 0.38), rotation: -360, opacity: 1,
        }, { x: 0, rotation: 0, opacity: 1, immediateRender: false, duration: 0.62, ease: "power2.out" }, rollAt)
          .to(letters.slice(1), { opacity: 1, duration: 0.01, stagger: 0.065, ease: "none" }, rollAt + 0.64);
      });
    };
    const jump = (next: MascotPlacement, initial = false) => {
      const wasDocked = current === "dock";
      flight?.kill();
      const rect = element.getBoundingClientRect();
      const dest = target(next);
      const start = initial
        ? { x: -dest.width, y: dest.y + 60, width: dest.width * 1.16 }
        : { x: rect.left, y: rect.top, width: rect.width };
      current = next;
      setPlacement(next);
      element.style.visibility = "visible";
      element.removeAttribute("inert");
      gsap.set(body, { scaleX: 1, scaleY: 1, rotation: 0, transformOrigin: "50% 78%" });
      if (reduced.matches) { park(); return; }
      progress.value = 0;
      const launchScroll = window.scrollY;
      const renderFlight = () => {
        const landing = target(next);
        const t = progress.value;
        const arc = Math.sin(Math.PI * t) * Math.min(initial ? 280 : 150, window.innerHeight * (initial ? 0.34 : 0.18));
        const width = start.width + (landing.width - start.width) * t;
        const launchY = start.y - (wasDocked ? 0 : window.scrollY - launchScroll);
        gsap.set(element, {
          x: start.x + (landing.x - start.x) * t,
          y: Math.max((initial ? topbar.getBoundingClientRect().bottom + 16 : 8) - width * 0.21, launchY + (landing.y - launchY) * t - arc),
          width,
        });
      };
      gsap.set(element, { x: start.x, y: start.y, width: start.width });
      flight = gsap.timeline({ onComplete: () => { flight = null; park(); schedule(); } })
        .to(body, { scaleX: 1.18, scaleY: 0.72, duration: 0.14, ease: "power2.in" })
        .to(body, { scaleX: 0.85, scaleY: 1.2, duration: 0.13, ease: "power2.out" })
        .to(progress, { value: 1, duration: initial ? 0.9 : 0.64, ease: initial ? "none" : "power1.inOut", onUpdate: renderFlight }, "<")
        .to(body, { scaleX: 1, scaleY: 1, rotation: wasDocked ? 360 : initial ? -12 : 0,
          duration: initial ? 0.9 : 0.64, ease: "power1.inOut" }, "<")
        .set(body, { rotation: wasDocked ? 0 : initial ? -12 : 0 })
        .to(body, { rotation: 0, scaleX: 1.16, scaleY: 0.8, duration: 0.1, ease: "power2.out" })
        .to(body, { scaleX: 1, scaleY: 1, duration: 0.26, ease: "back.out(2)" });
      if (initial) flight.to(body, { rotation: 8, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" });
    };
    const resolve = () => {
      frame = 0;
      if (!ready) return;
      if (!entered) {
        if (!intent || Math.abs(window.scrollY - baseline) < 2) return;
        entered = true;
        jump(choose(), true);
        return;
      }
      const next = choose();
      if (next !== current) jump(next);
      else if (!flight) park();
    };
    function schedule() {
      if (!frame) frame = requestAnimationFrame(resolve);
    }
    const onScroll = () => schedule();
    const arm = () => { if (ready) intent = true; };
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key)) arm();
    };
    const loaderObserver = new MutationObserver(() => {
      if (!document.querySelector('[aria-label="Loading Webberick"]')) {
        ready = true;
        baseline = window.scrollY;
        intent = false;
        loaderObserver.disconnect();
        animateHero();
      }
    });
    if (!ready) loaderObserver.observe(document.body, { childList: true, subtree: true });
    else animateHero();
    gsap.set(element, { position: "fixed", left: 0, top: 0, visibility: "hidden" });
    element.setAttribute("inert", "");
    window.addEventListener("wheel", arm, { passive: true });
    window.addEventListener("touchmove", arm, { passive: true });
    window.addEventListener("pointerdown", arm, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      loaderObserver.disconnect();
      cancelAnimationFrame(frame);
      flight?.kill();
      heroEntrance?.kill();
      titles.forEach((title) => title.classList.remove("is-typing"));
      gsap.set(titles, { clearProps: "opacity" });
      gsap.set(titles.flatMap((title) => Array.from(title.children)), { clearProps: "transform,opacity" });
      gsap.killTweensOf([body, element, progress]);
      window.removeEventListener("wheel", arm);
      window.removeEventListener("touchmove", arm);
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
    };
  }, [mascotRef]);
  return placement;
}

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  useHomepageStyles();
  useHomepageMotion();
  const mascotElementRef = useRef<HTMLElement>(null);
  const mascotPlacement = useMascotPlacement(mascotElementRef);

  const navigate = useNavigate();
  const clickCount = useRef(0);
  const clickResetTimer = useRef<number | null>(null);
  const previewCloseRef = useRef<HTMLButtonElement>(null);
  const [showAdminEntry, setShowAdminEntry] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => () => {
    if (clickResetTimer.current !== null) window.clearTimeout(clickResetTimer.current);
  }, []);

  useEffect(() => {
    if (!expandedPreview) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedPreview(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    previewCloseRef.current?.focus();
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [expandedPreview]);

  // Preserve the original homepage logo's triple-click admin entry (700ms).
  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    clickCount.current += 1;
    if (clickResetTimer.current !== null) window.clearTimeout(clickResetTimer.current);
    if (clickCount.current === 3) {
      clickCount.current = 0;
      setShowAdminEntry(true);
      return;
    }
    clickResetTimer.current = window.setTimeout(() => {
      clickCount.current = 0;
    }, 700);
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
  };

  const [form, setForm] = useState<InquiryForm>(initialInquiry);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("submitting");
    setSubmitMessage("");

    try {
      await apiFetch("/submissions/", {
        method: "POST",
        body: JSON.stringify(toSubmissionPayload(form)),
      });
      setSubmitState("success");
      setSubmitMessage("Got it. Your project note has been sent.");
      setForm(initialInquiry);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Project note could not be sent. Your details are still here so you can try again.");
    }
  };

  const contactMascotState: WebberickMascotState =
    submitState === "success"
      ? "success"
      : submitState === "submitting"
        ? "loading"
        : submitState === "error"
          ? "error"
          : "idle";

  const mascotState: WebberickMascotState = mascotPlacement === "contact" ? contactMascotState : mascotPlacement === "hero" ? "smile" : "idle";
  const submitLabel = submitState === "submitting" ? "Sending…" : "Send project note";

  const mascot = (
    <span ref={mascotElementRef} className={`mascot-flight mascot-flight--${mascotPlacement}`} data-flip-id="webberick-mascot">
    <span className="mascot-jump-body"><WebberickMascot
      state={mascotState}
      className="mascot-companion"
      interactive
      label="Webberick mascot — click to smile"
    /></span>
    </span>
  );

  return (
    <div className="webberick-home" data-theme={theme}>
      <header className="topbar" aria-label="Primary navigation">
        <div className="topbar__inner">
          <a className="wordmark" href="#hero" aria-label="Webberick home" onClick={handleBrandClick}>
            W<span className="cli" aria-hidden="true">_</span>
          </a>
          <div className="mascot-host mascot-host--dock" aria-hidden="true" />
          <div className="nav-viewport" id="navViewport">
            <nav className="nav-rail" id="navRail" aria-label="Homepage sections">
              <a href="#work" data-nav="work">Work</a>
              <a href="#services" data-nav="services">Services</a>
              <a href="#why-webberick" data-nav="why-webberick">Why</a>
              <a href="#about" data-nav="about">About</a>
              <a href="#faq" data-nav="faq">FAQ</a>
              <a href="#contact" data-nav="contact">Contact</a>
              <motion.button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                <motion.span
                  className="theme-toggle__icon"
                  initial={false}
                  animate={{ rotate: theme === "dark" ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === "dark" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
                </motion.span>
              </motion.button>
              <span className="nav-indicator" id="navIndicator" aria-hidden="true" />
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="hero" aria-label="Design, Development, Motion">
          <div className="shell hero-words">
            {[
              ["Design", "design"],
              ["Development", "development"],
              ["Motion", "motion"],
            ].map(([label, type]) => (
              <div className="hero-word charge-line" key={label}>
                <span className={`charge hero-charge charge--${type}`} data-text={label} aria-label={label}>
                  {Array.from(label).map((letter, index) => <span className="hero-letter" aria-hidden="true" key={index}>{letter}</span>)}
                </span>
                <span className="hover-cursor" aria-hidden="true">_</span>
              </div>
            ))}
            <div className="mascot-host mascot-host--hero" aria-hidden="true" />
          </div>
        </section>

        <section className="section" id="work" aria-labelledby="work-title">
          <div className="shell split">
            <div className="split__left reveal">
              <p className="label">01 / Work<span className="flow-cursor" aria-hidden="true">_</span></p>
              <h2 className="statement" id="work-title">Proof before promises<span className="pulse-dot">.</span></h2>
            </div>
            <div className="split__right">
              <div className="project-stack">
                <article className="project reveal">
                  <a className="project-media" href="https://www.solrasa.com" target="_blank" rel="noreferrer" aria-label="Visit Sol Rasa">
                    <img src="/template-previews/sol-rasa.png" alt="Sol Rasa fashion ecommerce website preview" />
                  </a>
                  <button className="preview-expand" type="button" onClick={() => setExpandedPreview({ src: "/template-previews/sol-rasa.png", title: "Sol Rasa" })}>Expand preview</button>
                  <div className="project-foot">
                    <div className="charge-line">
                      <h3 className="project-title charge charge--design" data-text="Sol Rasa">Sol Rasa</h3>
                      <span className="hover-cursor" aria-hidden="true">_</span>
                    </div>
                    <div className="project-side"><p className="micro">Live project</p><p>Fashion ecommerce</p></div>
                  </div>
                </article>

                <article className="project reveal">
                  <div className="project-media" aria-label="Craft Boutique Online preview">
                    <img src="/template-previews/craft-boutique-online.png" alt="Craft Boutique Online ecommerce storefront preview" />
                  </div>
                  <button className="preview-expand" type="button" onClick={() => setExpandedPreview({ src: "/template-previews/craft-boutique-online.png", title: "Craft Boutique Online" })}>Expand preview</button>
                  <div className="project-foot">
                    <div className="charge-line">
                      <h3 className="project-title charge charge--motion" data-text="Craft Boutique Online">Craft Boutique Online</h3>
                      <span className="hover-cursor" aria-hidden="true">_</span>
                    </div>
                    <div className="project-side"><p className="micro">Project preview</p><p>Handicraft ecommerce</p></div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="services" aria-labelledby="services-title">
          <div className="shell split">
            <div className="split__left reveal">
              <p className="label">02 / Services<span className="flow-cursor" aria-hidden="true">_</span></p>
              <h2 className="statement" id="services-title">From idea to experience<span className="pulse-dot">.</span></h2>
            </div>
            <div className="split__right reveal">
              <div className="editorial-rows">
                {[
                  ["Design", "design", "Brand sites · ecommerce · interface systems"],
                  ["Development", "development", "Responsive UI · full-stack implementation"],
                  ["Motion", "motion", "Interface motion · brand animation · story"],
                ].map(([title, type, note]) => (
                  <article className="editorial-row charge-zone" key={title}>
                    <div className="charge-line"><h3 className={`row-title charge charge--${type}`} data-text={title}>{title}</h3><span className="hover-cursor" aria-hidden="true">_</span></div>
                    <p className="row-note">{note}</p>
                  </article>
                ))}
              </div>
              <nav className="service-route-links" aria-label="Explore services">
                <Link to="/web-development">Web development ↗</Link>
                <Link to="/animation">Animation ↗</Link>
                <Link to="/video-production">Video production ↗</Link>
              </nav>
            </div>
          </div>
        </section>

        <section className="section" id="why-webberick" aria-labelledby="why-title">
          <div className="shell split">
            <div className="split__left reveal">
              <p className="label">03 / Why<span className="flow-cursor" aria-hidden="true">_</span></p>
              <h2 className="statement" id="why-title">One process. Start to finish<span className="pulse-dot">.</span></h2>
              <div className="mascot-host mascot-host--process" aria-hidden="true" />
            </div>
            <div className="split__right reveal">
              <div className="editorial-rows">
                {[
                  ["01", "Understand", "cyan", "Goals · audience · constraints"],
                  ["02", "Shape", "design", "Message · structure · direction"],
                  ["03", "Build", "development", "Responsive implementation"],
                  ["04", "Refine", "motion", "QA · performance · accessibility"],
                  ["05", "Launch", "mint", "Deployment · handoff"],
                ].map(([number, title, type, note]) => (
                  <article className="editorial-row process-row" key={number}>
                    <div className="row-main"><span className="row-num">{number}</span><div className="charge-line"><h3 className={`row-title charge charge--${type}`} data-text={title}>{title}</h3><span className="hover-cursor" aria-hidden="true">_</span></div></div>
                    <p className="row-note">{note}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="about" aria-labelledby="about-title">
          <div className="shell split">
            <div className="split__left reveal">
              <p className="label">04 / About<span className="flow-cursor" aria-hidden="true">_</span></p>
              <h2 className="statement about-statement" id="about-title">
                <span className="about-statement__line">Creative by instinct<span className="pulse-dot">.</span></span>{" "}
                <span className="about-statement__line">Technical by practice<span className="pulse-dot">.</span></span>
              </h2>
            </div>
            <div className="split__right reveal">
              <div className="about-copy">
                <p className="about-lead">Independent creative developer working across <span className="charge charge--design" data-text="design">design</span>, <span className="charge charge--development" data-text="development">development</span>, and <span className="charge charge--motion" data-text="motion">motion</span>.</p>
                <p className="about-note">The technical depth supports the experience instead of competing with it.</p>
                <div className="tech" aria-label="Supporting technical depth">
                  <span>Full-stack</span><span>Backend / data</span><span>AI integration</span><span>Data science</span><span>Bioinformatics</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="faq" aria-labelledby="faq-title">
          <div className="shell split">
            <div className="split__left reveal">
              <p className="label">05 / FAQ<span className="flow-cursor" aria-hidden="true">_</span></p>
              <h2 className="statement" id="faq-title">Clear answers before we start<span className="pulse-dot">.</span></h2>
            </div>
            <div className="split__right reveal">
              <div className="faq editorial-rows">
                <details>
                  <summary><span className="faq-question charge charge--cyan" data-text="What kinds of projects do you take on?">What kinds of projects do you take on?</span><span className="faq-state" aria-hidden="true" /></summary>
                  <p className="faq-answer">Primarily web design and development, with motion and video where they strengthen the experience.</p>
                </details>
                <details>
                  <summary><span className="faq-question charge charge--development" data-text="Do you handle design and development?">Do you handle design and development?</span><span className="faq-state" aria-hidden="true" /></summary>
                  <p className="faq-answer">Yes. Exact scope and collaborators are defined before the build.</p>
                </details>
                <details>
                  <summary><span className="faq-question charge charge--motion" data-text="Can you build ecommerce?">Can you build ecommerce?</span><span className="faq-state" aria-hidden="true" /></summary>
                  <p className="faq-answer">Yes. The current portfolio includes live and preview ecommerce work.</p>
                </details>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="contact" aria-labelledby="contact-title">
          <div className="shell split">
            <div className="split__left reveal">
              <p className="label">06 / Contact<span className="flow-cursor" aria-hidden="true">_</span></p>
              <h2 className="statement" id="contact-title">Bring the rough idea<span className="pulse-dot">.</span></h2>
            </div>
            <div className="split__right reveal">
              <div className="contact-intro">
                <p className="contact-lead">A rough idea is enough to start<span className="pulse-dot">.</span></p>
              </div>
              <div className="contact-form-wrap">
                <form className="form" aria-label="Project inquiry" onSubmit={submitInquiry}>
                  <div className="field"><label htmlFor="name" className="charge charge--cyan" data-text="Name">Name</label><input id="name" name="name" autoComplete="name" required placeholder="Your name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
                  <div className="field"><label htmlFor="email" className="charge charge--development" data-text="Email">Email</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></div>
                  <div className="field"><label htmlFor="phone">Phone · optional</label><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="Your number" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></div>
                  <div className="field"><label htmlFor="country">Country</label><input id="country" name="country" required autoComplete="country-name" placeholder="Your country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} /></div>
                  <div className="field field--wide"><label htmlFor="service" className="charge charge--mint" data-text="Service · optional">Service · optional</label><select id="service" name="service" value={form.service} onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))}><option value="">Choose if useful</option><option>Web Design &amp; Development</option><option>Motion &amp; Interaction</option><option>Video &amp; Creative Content</option></select></div>
                  <div className="field field--wide"><label htmlFor="message" className="charge charge--design" data-text="What are you looking to build?">What are you looking to build?</label><textarea id="message" name="message" required placeholder="A few lines are enough." value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} /></div>
                  <div className="field"><label htmlFor="budget">Project budget</label><input id="budget" name="budget" type="number" min="0" step="0.01" inputMode="decimal" required placeholder="Estimated amount" value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} /></div>
                  <div className="field"><label htmlFor="currency">Currency</label><select id="currency" name="currency" required value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as InquiryForm["currency"] }))}><option value="USD">USD ($)</option><option value="INR">INR (₹)</option></select></div>
                  <div className="field"><label htmlFor="duration">Timeline</label><select id="duration" name="duration" required value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}><option value="">Choose a timeline</option><option value="asap">ASAP (rush)</option><option value="1-2-weeks">1–2 weeks</option><option value="1-month">1 month</option><option value="2-3-months">2–3 months</option><option value="flexible">Flexible</option></select></div>
                  <div className="field"><label htmlFor="project-type">Project type</label><select id="project-type" name="projectType" required value={form.projectType} onChange={(event) => setForm((current) => ({ ...current, projectType: event.target.value as InquiryForm["projectType"] }))}><option value="">Choose a project type</option><option value="personal">Personal</option><option value="company">Company / business</option></select></div>
                  <div className="form-actions">
                    <button className="text-button" type="submit" disabled={submitState === "submitting"}><span className="charge charge--development" data-text={submitLabel}>{submitLabel}</span></button>
                    {submitMessage && <p className={`micro form-status form-status--${submitState}`} role="status" aria-live="polite">{submitMessage}</p>}
                  </div>
                </form>
                <div className="mascot-host mascot-host--contact" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell">
          <span>Webberick<span className="cli" aria-hidden="true">_</span></span>
          <span>Design · Development · Motion</span>
          <span>2026</span>
        </div>
      </footer>
      <div className="mascot-flight-layer" aria-live="off">{mascot}</div>
      {expandedPreview && (
        <div className="preview-lightbox" role="dialog" aria-modal="true" aria-label={`${expandedPreview.title} preview`} onClick={() => setExpandedPreview(null)}>
          <button ref={previewCloseRef} type="button" className="preview-lightbox__close" aria-label="Close preview" onClick={() => setExpandedPreview(null)}>×</button>
          <img src={expandedPreview.src} alt={`${expandedPreview.title} full website preview`} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
      {showAdminEntry && (
        <AdminEntryAnimation
          onComplete={() => {
            setShowAdminEntry(false);
            navigate("/admin/login");
          }}
        />
      )}
    </div>
  );
};

export default Index;
