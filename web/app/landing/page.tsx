"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Check,
  Cpu,
  Gauge,
  LayoutDashboard,
  Network,
  Sparkles,
  Terminal,
  TrendingDown,
  Workflow,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export default function ConverzaLanding() {
  const root = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Nav morph on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Master GSAP context
  useEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from(".hero-eyebrow", {
        y: 14,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
      gsap.from(".hero-word", {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.1,
      });
      gsap.from(".hero-sub", {
        y: 20,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.45,
      });
      gsap.from(".hero-cta", {
        y: 14,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.6,
      });
      gsap.from(".hero-mockup", {
        y: 30,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.35,
      });

      // Section entrance pattern
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });

      // Manifesto word-by-word
      const words = gsap.utils.toArray<HTMLElement>(".manifesto-word");
      gsap.from(words, {
        opacity: 0.12,
        y: 0,
        ease: "none",
        stagger: { each: 0.06 },
        scrollTrigger: {
          trigger: ".manifesto",
          start: "top 70%",
          end: "bottom 60%",
          scrub: true,
        },
      });

      // Feature 1 — node sequence
      const nodes = gsap.utils.toArray<HTMLElement>(".node-pulse");
      const nodeTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.3,
        scrollTrigger: {
          trigger: ".feature-swarm",
          start: "top 80%",
        },
      });
      nodes.forEach((n, i) => {
        nodeTl.to(
          n,
          {
            backgroundColor: "#0070F3",
            scale: 1.18,
            duration: 0.25,
            ease: "power2.out",
          },
          i * 0.2,
        );
        nodeTl.to(
          n,
          {
            backgroundColor: "#000000",
            scale: 1,
            duration: 0.45,
            ease: "power2.out",
          },
          i * 0.2 + 0.25,
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative">
      {/* ───────────── NAV ───────────── */}
      <header className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <nav
          className={`pointer-events-auto flex w-full max-w-[920px] items-center justify-between gap-3 rounded-full pl-3 pr-2 py-2 transition-all duration-300 ${
            scrolled
              ? "border border-black/[0.05] bg-white/85 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.10)] backdrop-blur-md"
              : "border border-black/[0.04] bg-white/65 backdrop-blur-md"
          }`}
        >
          <a href="#top" className="flex items-center gap-2.5 px-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0070F3] text-white">
              <LayoutDashboard size={14} strokeWidth={2.4} />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">
              Converza
            </span>
          </a>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink href="#features">Infrastructure</NavLink>
            <NavLink href="#manifesto">Protocol</NavLink>
            <NavLink href="#pilot">Capabilities</NavLink>
          </div>
          <a
            href="#pilot"
            className="group inline-flex items-center gap-1.5 rounded-full bg-[#0070F3] px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_4px_18px_rgba(0,112,243,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0060d4]"
          >
            Book Pilot
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </nav>
      </header>

      {/* ───────────── HERO ───────────── */}
      <section
        id="top"
        className="relative px-6 pt-44 pb-44 md:pt-52 md:pb-56"
      >
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-20 lg:grid-cols-[1.05fr_1fr] lg:gap-24">
          {/* Left */}
          <div>
            <div className="hero-eyebrow mb-12 inline-flex items-center gap-2.5 rounded-full border border-black/[0.06] bg-white px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/65 shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0070F3] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0070F3]" />
              </span>
              System online: 19 nodes
            </div>

            <h1 className="hero-h1 text-[clamp(56px,7.6vw,112px)] font-semibold leading-[0.98] tracking-[-0.045em]">
              <span className="hero-word block">Replace the</span>
              <span
                className="hero-word block italic text-[#0070F3]"
                style={{
                  fontFamily:
                    "var(--font-serif), 'Instrument Serif', Georgia, serif",
                  fontWeight: 400,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                }}
              >
                Marketing Agency.
              </span>
            </h1>

            <p className="hero-sub mt-12 max-w-[520px] text-[18px] leading-[1.65] text-black/55">
              Target international markets with native-English campaigns. Do it
              without hiring freelancers, managing editors, or writing scripts.{" "}
              <span className="font-medium text-black">
                No human management required.
              </span>
            </p>

            <div className="hero-cta mt-12 flex flex-wrap items-center gap-3">
              <a
                href="#pilot"
                className="group inline-flex items-center gap-2.5 rounded-full bg-black px-7 py-4 text-[14.5px] font-medium text-white shadow-[0_10px_28px_-8px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#1a1a1a]"
              >
                Book Your $500 Pilot
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/45">
              <span className="inline-flex items-center gap-1.5">
                <Check size={11} strokeWidth={2.5} className="text-black" />{" "}
                Cancel anytime
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={11} strokeWidth={2.5} className="text-black" />{" "}
                Keep assets
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={11} strokeWidth={2.5} className="text-black" />{" "}
                Native US + UAE
              </span>
            </div>
          </div>

          {/* Right — Infrastructure panel */}
          <div className="hero-mockup">
            <InfrastructurePanel />
          </div>
        </div>
      </section>

      {/* ───────────── TRUST BAND ───────────── */}
      <section
        aria-label="Trusted by ecommerce operators"
        className="relative border-y border-black/[0.05] bg-[#FAFAFA] px-6 py-14"
      >
        <div className="mx-auto max-w-[1240px]">
          <div className="reveal grid grid-cols-1 items-center gap-10 md:grid-cols-[auto_1fr] md:gap-14">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/55">
              Pilots running with operators in
            </p>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 text-black/55">
              {[
                "Tashkent",
                "Almaty",
                "Dubai",
                "Istanbul",
                "Brooklyn",
                "Riyadh",
              ].map((city) => (
                <span
                  key={city}
                  className="font-semibold tracking-[-0.01em] text-[15px]"
                  style={{
                    fontFamily:
                      "var(--font-serif), 'Instrument Serif', Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: "20px",
                  }}
                >
                  {city}
                </span>
              ))}
            </div>
          </div>

          <div className="reveal mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-black/[0.06] md:grid-cols-3">
            {[
              {
                k: "$3,800",
                v: "Average monthly cost vs. a Western retainer",
              },
              {
                k: "60",
                v: "Native-English ad variants per pilot run",
              },
              {
                k: "24h",
                v: "From brief to a full month of approved assets",
              },
            ].map((s) => (
              <div key={s.k} className="bg-white px-8 py-7">
                <div className="text-[40px] font-semibold leading-none tracking-[-0.035em]">
                  {s.k}
                </div>
                <div className="mt-3 max-w-[260px] text-[14px] leading-snug text-black/55">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FEATURES ───────────── */}
      <section
        id="features"
        className="relative px-6 py-44 md:py-56"
      >
        <div className="mx-auto max-w-[1240px]">
          <div className="reveal mb-5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/45">
            <span className="text-[#0070F3]">/</span> Infrastructure
          </div>
          <h2 className="reveal max-w-[900px] text-[clamp(38px,4.6vw,68px)] font-semibold leading-[1.02] tracking-[-0.035em]">
            Three artifacts.{" "}
            <span
              className="italic text-[#0070F3]"
              style={{
                fontFamily:
                  "var(--font-serif), 'Instrument Serif', Georgia, serif",
                fontWeight: 400,
                letterSpacing: "-0.02em",
              }}
            >
              One autonomous workforce.
            </span>
          </h2>

          <div className="mt-24 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Card 1 — The Swarm */}
            <article className="reveal feature-swarm group relative col-span-1 overflow-hidden rounded-3xl bg-[#FAFAFA] p-8 shadow-sm transition-shadow duration-300 hover:shadow-md md:p-10 lg:col-span-7">
              <FeatureLabel
                icon={<Network size={14} />}
                tag="01 / The Swarm"
              />
              <h3 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.025em]">
                19-node autonomous architecture.
              </h3>
              <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-black/55">
                Each role — copy, edit, schedule, render — runs as its own
                agent. They work in parallel, not in line.
              </p>
              <div className="mt-9">
                <SwarmGraph />
              </div>
            </article>

            {/* Card 2 — The Output */}
            <article className="reveal group relative col-span-1 overflow-hidden rounded-3xl bg-[#FAFAFA] p-8 shadow-sm transition-shadow duration-300 hover:shadow-md md:p-10 lg:col-span-5">
              <FeatureLabel icon={<Terminal size={14} />} tag="02 / The Output" />
              <h3 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.025em]">
                60 video ads in 24 hours.
              </h3>
              <p className="mt-3 max-w-[400px] text-[15px] leading-relaxed text-black/55">
                Live render feed. No queues. No editor handoffs.
              </p>
              <div className="mt-9">
                <RenderFeed />
              </div>
            </article>

            {/* Card 3 — The Economics */}
            <article className="reveal group relative col-span-1 overflow-hidden rounded-3xl bg-[#FAFAFA] p-8 shadow-sm transition-shadow duration-300 hover:shadow-md md:p-10 lg:col-span-12">
              <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.25fr] md:items-center">
                <div>
                  <FeatureLabel
                    icon={<TrendingDown size={14} />}
                    tag="03 / The Economics"
                  />
                  <h3 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.025em]">
                    Zero human latency.
                  </h3>
                  <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-black/55">
                    Same workload. One-tenth the cost. Ten times the cadence.
                  </p>
                </div>
                <CompareTable />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ───────────── WHO THIS IS FOR (ICP) ───────────── */}
      <section
        id="who"
        className="relative px-6 py-40 md:py-48"
      >
        <div className="mx-auto max-w-[1240px]">
          <div className="reveal mb-5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/45">
            <span className="text-[#0070F3]">/</span> Built for
          </div>
          <h2 className="reveal max-w-[860px] text-[clamp(34px,4vw,56px)] font-semibold leading-[1.04] tracking-[-0.035em]">
            Three operators we{" "}
            <span
              className="italic text-[#0070F3]"
              style={{
                fontFamily:
                  "var(--font-serif), 'Instrument Serif', Georgia, serif",
                fontWeight: 400,
              }}
            >
              actually serve.
            </span>
          </h2>
          <p className="reveal mt-5 max-w-[640px] text-[16px] leading-relaxed text-black/55">
            We are not for everyone. If you recognise yourself in one of these,
            the pilot will pay back inside 30 days.
          </p>

          <div className="reveal mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                tag: "01 / The CIS exporter",
                title: "Selling globally from Tashkent or Almaty.",
                body: "You ship products to the US and Dubai but a Western agency retainer ($5k+) is impossible. You need native-English creative without paying native-English overhead.",
                tick: ["English-native copy", "US + UAE markets", "Pay in USD or local"],
              },
              {
                tag: "02 / The DTC operator",
                title: "$3M to $15M GMV. Wants 10× output, not 10× headcount.",
                body: "You already have a brand, a product, a Shopify, and an ad account. You are tired of editor backlogs and copywriter ghosting. You need volume and consistency.",
                tick: ["Up to 250 ads / month", "Brand passport reuse", "Slack + email approvals"],
              },
              {
                tag: "03 / The marketplace seller",
                title: "Amazon, Noon, Wildberries. Constant creative refresh.",
                body: "Your listings die in 2 weeks. You need fresh hooks, new B-roll, regional copy, and a calendar that ships without you babysitting it.",
                tick: ["A/B hook testing", "Auto-scheduling", "Regional voice presets"],
              },
            ].map((p) => (
              <article
                key={p.tag}
                className="rounded-3xl bg-[#FAFAFA] p-7 shadow-sm transition-shadow duration-300 hover:shadow-md md:p-8"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/55">
                  {p.tag}
                </div>
                <h3 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.02em]">
                  {p.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-black/55">
                  {p.body}
                </p>
                <ul className="mt-6 space-y-2">
                  {p.tick.map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2 text-[13px] text-black/75"
                    >
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black text-white">
                        <Check size={10} strokeWidth={2.5} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── MANIFESTO ───────────── */}
      <section
        id="manifesto"
        className="manifesto relative bg-black px-6 py-56 text-white md:py-72"
      >
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-10 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
            <span className="text-[#0070F3]">/</span> Manifesto
          </div>
          <h2 className="text-[clamp(38px,5.6vw,84px)] font-semibold leading-[1.04] tracking-[-0.035em]">
            <ManifestoText>Most agencies focus on human hours. We focus on </ManifestoText>
            <span
              className="manifesto-word italic text-[#0070F3]"
              style={{
                fontFamily:
                  "var(--font-serif), 'Instrument Serif', Georgia, serif",
                fontWeight: 400,
              }}
            >
              mathematical execution.
            </span>
          </h2>
          <p className="mt-12 max-w-[640px] text-[17px] leading-relaxed text-white/55">
            Converza is a deterministic marketing system. Brief in. Approved
            assets out. Variance lives in your brand voice — not in whoever
            picked up the Slack ping at 9pm.
          </p>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="relative px-6 py-40 md:py-48">
        <div className="mx-auto max-w-[1100px]">
          <div className="reveal grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.6fr] md:gap-20">
            <div className="md:sticky md:top-32 md:self-start">
              <div className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/45">
                <span className="text-[#0070F3]">/</span> The questions every
                founder asks
              </div>
              <h2 className="text-[clamp(34px,3.6vw,52px)] font-semibold leading-[1.04] tracking-[-0.035em]">
                Answered{" "}
                <span
                  className="italic text-[#0070F3]"
                  style={{
                    fontFamily:
                      "var(--font-serif), 'Instrument Serif', Georgia, serif",
                    fontWeight: 400,
                  }}
                >
                  before you ask.
                </span>
              </h2>
              <p className="mt-5 max-w-[400px] text-[15px] leading-relaxed text-black/55">
                Six things B2B buyers always check before a pilot. Plain
                answers, no asterisks.
              </p>
            </div>

            <div className="reveal divide-y divide-black/[0.08]">
              <FaqItem
                q="Who owns the assets we generate?"
                a="You do. Forever. The brand passport, every ad variant, every cut, every caption. Even if you cancel on Day 13, you keep everything we shipped to your approval inbox."
              />
              <FaqItem
                q="What if the output is bad?"
                a="Cancel before Day 14, full refund. Keep every asset already produced. We do not lock you into anything you cannot walk away from in two weeks."
              />
              <FaqItem
                q="Do you replace agencies fully or augment them?"
                a="Most pilots replace. A few teams keep an agency for brand campaigns and use Converza for high-volume mid-funnel creative. Both work. We tell you which one fits in onboarding."
              />
              <FaqItem
                q="Where is our data stored? Do you train on it?"
                a="EU and US regions, your choice. SOC 2 Type II in audit. Customer data is never used to train base models. Your brand passport stays inside your tenant."
              />
              <FaqItem
                q="What if we don't have a brand book yet?"
                a="We build one in the 15-minute onboarding call. Voice, promise, audience, market, pricing — captured once, reused forever. Most founders leave the call with a sharper brand than they walked in with."
              />
              <FaqItem
                q="Can you use our own product footage and B-roll?"
                a="Yes. Drop a folder of clips, photos, and reviews. We generate variants on top of your real material. Pure-AI creative is an option, not a requirement."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── PILOT CTA ───────────── */}
      <section id="pilot" className="relative px-6 py-44 md:py-56">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[32px] bg-[#FAFAFA] p-12 shadow-sm md:p-20">
          <div className="reveal grid grid-cols-1 items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-black/55 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0070F3]" />3 of 5
                pilot spots remaining
              </div>
              <h2 className="text-[clamp(34px,4vw,60px)] font-semibold leading-[1.02] tracking-[-0.035em]">
                Run your first 60 ads{" "}
                <span
                  className="italic text-[#0070F3]"
                  style={{
                    fontFamily:
                      "var(--font-serif), 'Instrument Serif', Georgia, serif",
                    fontWeight: 400,
                  }}
                >
                  this week.
                </span>
              </h2>
              <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-black/55">
                One 15-minute call to capture your brand passport. 24 hours
                later, 60 ad variants in your approval inbox. Cancel before Day
                14, full refund, keep every asset.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="https://cal.com/converza/pilot"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-[#0070F3] px-7 py-4 text-[15px] font-medium text-white shadow-[0_10px_28px_rgba(0,112,243,0.32)] transition-transform duration-200 hover:scale-[1.02] hover:bg-[#0060d4]"
                >
                  Book a 15-min call
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </a>
                <a
                  href="mailto:pilot@converza.ai"
                  className="inline-flex items-center gap-2 rounded-full border border-black/[0.10] bg-white px-6 py-4 text-[14.5px] font-medium text-black transition-all duration-200 hover:scale-[1.01] hover:border-black"
                >
                  Or email pilot@converza.ai
                </a>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-black/45">
                <span className="inline-flex items-center gap-1.5">
                  <Check size={11} strokeWidth={2.5} className="text-black" />{" "}
                  No credit card to book
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check size={11} strokeWidth={2.5} className="text-black" />{" "}
                  SOC 2 in audit
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check size={11} strokeWidth={2.5} className="text-black" />{" "}
                  Reply within 4h
                </span>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-3">
              {[
                "60 native-English ad variants per run",
                "Auto-scheduling across TikTok, Reels, Shorts",
                "Human-in-the-loop approval inbox",
                "Per-campaign cost meter, no surprise invoices",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 text-[14px] text-black/75"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <Check size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="relative border-t border-black/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold tracking-tight">
              Converza
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">
              v0.1 · Tashkent
            </span>
          </div>

          <div className="inline-flex items-center gap-2.5 rounded-full border border-black/[0.06] bg-[#FAFAFA] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-black/65">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            System operational
          </div>

          <div className="flex flex-wrap gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-black/45">
            {[
              { href: "#features", label: "Infrastructure" },
              { href: "#who", label: "Who" },
              { href: "#faq", label: "FAQ" },
              { href: "#pilot", label: "Pilot" },
              { href: "mailto:hello@converza.ai", label: "Contact" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="inline-flex min-h-[44px] items-center rounded-full px-3 transition-colors hover:bg-black/[0.04] hover:text-black"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-[1200px] font-mono text-[10px] uppercase tracking-[0.2em] text-black/30">
          © 2026 Converza Labs. All telemetry deterministic.
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded-full px-3 py-1.5 text-[13px] text-black/65 transition-colors hover:bg-black/[0.04] hover:text-black"
    >
      {children}
    </a>
  );
}

function SplitWords({ children }: { children: string }) {
  // Split into words wrapped in <span> for stagger reveal.
  const words = children.split(/\s+/);
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="inline-block whitespace-pre">
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

function ManifestoText({ children }: { children: string }) {
  const words = children.split(/\s+/);
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="manifesto-word inline-block whitespace-pre">
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

function FeatureLabel({
  icon,
  tag,
}: {
  icon: React.ReactNode;
  tag: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-black/55">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.08] bg-white text-black">
        {icon}
      </span>
      {tag}
    </div>
  );
}

// ───────────── Hero Infrastructure Panel ─────────────

function InfrastructurePanel() {
  return (
    <div className="relative">
      {/* Soft blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(0,112,243,0.08),transparent_70%)] blur-2xl"
      />

      {/* Tall facility card */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-gradient-to-b from-[#F4F4F5] via-[#FAFAFA] to-[#EDEDF0] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18),0_8px_24px_-12px_rgba(0,0,0,0.10)]">
        {/* Architectural lines — vanishing-point corridor */}
        <svg
          aria-hidden
          viewBox="0 0 400 500"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="line-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.10)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.04)" />
            </linearGradient>
            <linearGradient id="floor-fade" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>

          {/* Floor */}
          <rect x="0" y="320" width="400" height="180" fill="url(#floor-fade)" />

          {/* Vanishing-point grid — ceiling slats */}
          {Array.from({ length: 9 }).map((_, i) => {
            const t = (i + 1) / 10;
            const yTop = 30 + t * 140;
            return (
              <line
                key={`c-${i}`}
                x1={200 - 200 * (1 - t * 0.8)}
                x2={200 + 200 * (1 - t * 0.8)}
                y1={yTop}
                y2={yTop}
                stroke="url(#line-fade)"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Vanishing-point grid — floor slats */}
          {Array.from({ length: 7 }).map((_, i) => {
            const t = (i + 1) / 8;
            const yBot = 500 - t * 180;
            return (
              <line
                key={`f-${i}`}
                x1={200 - 200 * (1 - t * 0.8)}
                x2={200 + 200 * (1 - t * 0.8)}
                y1={yBot}
                y2={yBot}
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="1"
              />
            );
          })}

          {/* Side wall verticals — left */}
          <line x1="0" y1="0" x2="200" y2="240" stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" />
          <line x1="40" y1="0" x2="200" y2="240" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          <line x1="80" y1="0" x2="200" y2="240" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
          {/* Side wall verticals — right */}
          <line x1="400" y1="0" x2="200" y2="240" stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" />
          <line x1="360" y1="0" x2="200" y2="240" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          <line x1="320" y1="0" x2="200" y2="240" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
          {/* Floor verticals */}
          <line x1="0" y1="500" x2="200" y2="260" stroke="rgba(0,0,0,0.06)" strokeWidth="1.2" />
          <line x1="400" y1="500" x2="200" y2="260" stroke="rgba(0,0,0,0.06)" strokeWidth="1.2" />

          {/* Vanishing point dot */}
          <circle cx="200" cy="250" r="2.5" fill="rgba(0,0,0,0.18)" />
        </svg>

        {/* Top tag */}
        <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.22em] text-black/55 shadow-sm backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Facility · live
        </div>

        {/* Right floating circular icon button */}
        <div className="absolute right-5 top-1/2 z-10 -translate-y-1/2">
          <button
            aria-label="Open dashboard"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0070F3] text-white shadow-[0_10px_28px_rgba(0,112,243,0.35)] transition-transform duration-200 hover:scale-[1.05]"
          >
            <LayoutDashboard size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Bottom-left rendering widget */}
        <div className="absolute inset-x-5 bottom-5 z-10 rounded-2xl border border-black/[0.05] bg-white/95 p-4 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/55">
              Node 04 / Rendering
            </span>
            <span className="font-mono text-[10px] tabular-nums uppercase tracking-[0.22em] text-black">
              74%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-[#0070F3]"
              style={{ width: "74%" }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-black/40">
            <span>Variant 14 / 60</span>
            <span>~ 6m left</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────── Hero Command Center (legacy, unused) ─────────────

function CommandCenter() {
  return (
    <div className="relative">
      {/* Subtle blue glow behind */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(ellipse_at_center,rgba(0,112,243,0.06),transparent_70%)] blur-2xl"
      />
      <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18),0_8px_24px_-12px_rgba(0,0,0,0.12)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-black/[0.05] bg-[#FAFAFA] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-black/45">
            converza.command-center
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Active
          </span>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">
                Active Swarm
              </div>
              <div className="mt-1 text-[14px] font-medium tracking-tight">
                Fall Launch · Market US
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">
                Throughput
              </div>
              <div className="mt-1 font-mono text-[13px] font-medium tabular-nums">
                18 / 60 cuts
              </div>
            </div>
          </div>

          {/* Agent rows */}
          <div className="space-y-2">
            {[
              { name: "Orchestrator", status: "done", meta: "Ready" },
              {
                name: "Copywriter",
                status: "active",
                meta: "60 variants",
              },
              {
                name: "Video editor",
                status: "active",
                meta: "Cuts 18/60",
              },
              { name: "Scheduler", status: "queue", meta: "Queued" },
            ].map((row) => (
              <AgentRow key={row.name} {...row} />
            ))}
          </div>

          {/* HITL approval */}
          <div className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-black">
                Approval needed · Ad #12
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">
                0:14s · Reels
              </span>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-black/85">
              "Your skin routine is working against you.{" "}
              <span className="font-medium text-black">
                Swap 3 products for 1.
              </span>{" "}
              Free shipping to the US until Friday."
            </p>
            <div className="mt-3 flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[12px] font-medium text-white">
                <Check size={12} />
                Approve & schedule
              </button>
              <button className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-black/65">
                Request changes
              </button>
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`relative aspect-[9/16] flex-1 overflow-hidden rounded-lg ${
                  i === 0
                    ? "bg-gradient-to-br from-black to-[#1a1a1a]"
                    : "bg-gradient-to-br from-[#F4F4F5] to-[#E4E4E7]"
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">
                  {i === 0 ? "live" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentRow({
  name,
  status,
  meta,
}: {
  name: string;
  status: "done" | "active" | "queue";
  meta: string;
}) {
  const dotColor =
    status === "active"
      ? "bg-emerald-500"
      : status === "done"
        ? "bg-black"
        : "bg-black/20";
  const pillStyles =
    status === "active"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "done"
        ? "bg-black/[0.05] text-black/65"
        : "bg-transparent text-black/40";

  return (
    <div className="flex items-center justify-between rounded-xl border border-black/[0.05] bg-[#FAFAFA] px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          {status === "active" ? (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-60`}
            />
          ) : null}
          <span className={`relative h-2 w-2 rounded-full ${dotColor}`} />
        </span>
        <span className="text-[13px] font-medium tracking-tight">{name}</span>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${pillStyles}`}
      >
        {status === "active"
          ? "Running"
          : status === "done"
            ? "Done"
            : "Queued"}
      </span>
      <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.18em] text-black/40 tabular-nums">
        {meta}
      </span>
    </div>
  );
}

// ───────────── Feature 1: Swarm Graph ─────────────

function SwarmGraph() {
  // 19 nodes laid out in a 3-tier mesh.
  const layers = [
    { y: 14, count: 5, label: "Ingest" },
    { y: 50, count: 7, label: "Generate" },
    { y: 86, count: 7, label: "Distribute" },
  ];

  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-black/[0.05] bg-white">
      {/* Grid bg */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {/* connections */}
        {layers.slice(0, -1).flatMap((layer, li) => {
          const next = layers[li + 1];
          const lines: React.ReactElement[] = [];
          for (let i = 0; i < layer.count; i++) {
            const x1 = ((i + 1) / (layer.count + 1)) * 100;
            for (let j = 0; j < next.count; j++) {
              const x2 = ((j + 1) / (next.count + 1)) * 100;
              if (Math.abs(i - j) > 2) continue; // sparser mesh
              lines.push(
                <line
                  key={`${li}-${i}-${j}`}
                  x1={x1}
                  y1={layer.y}
                  x2={x2}
                  y2={next.y}
                  stroke="rgba(0,0,0,0.10)"
                  strokeWidth="0.15"
                  vectorEffect="non-scaling-stroke"
                />,
              );
            }
          }
          return lines;
        })}
      </svg>

      {/* Nodes */}
      {layers.map((layer, li) => (
        <div key={li} className="absolute inset-x-0" style={{ top: `${layer.y}%` }}>
          <div className="relative mx-auto flex max-w-[92%] -translate-y-1/2 items-center justify-between">
            {Array.from({ length: layer.count }).map((_, i) => (
              <span
                key={i}
                className="node-pulse h-2.5 w-2.5 rounded-full bg-black"
              />
            ))}
          </div>
        </div>
      ))}

      {/* Layer labels */}
      <div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-black/40">
        <span>Ingest · 5</span>
        <span>Generate · 7</span>
        <span>Distribute · 7</span>
      </div>

      {/* Live tag */}
      <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-black/65 shadow-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0070F3]" />
        Live mesh
      </div>
    </div>
  );
}

// ───────────── Feature 2: Render Feed ─────────────

function RenderFeed() {
  const variants = [
    "Initializing swarm…",
    "Pulling brand passport: osman_skincare",
    "Rendering variant 11/60… Success",
    "Rendering variant 12/60… Success",
    "Rendering variant 13/60… Success",
    "Approval queued: ad_012.mp4",
    "Rendering variant 14/60… Success",
    "Scheduling: tiktok_us · 9:14 AM",
  ];
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let cancelled = false;
    const target = variants[idx];
    let i = 0;
    setTyped("");
    const tick = () => {
      if (cancelled) return;
      if (i <= target.length) {
        setTyped(target.slice(0, i));
        i++;
        setTimeout(tick, 22);
      } else {
        setTimeout(() => {
          if (!cancelled) setIdx((n) => (n + 1) % variants.length);
        }, 900);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Show last few lines as completed history
  const history = Array.from({ length: 4 }).map((_, i) => {
    const offset = idx - (4 - i);
    const safe = ((offset % variants.length) + variants.length) % variants.length;
    return offset < 0 ? null : variants[safe];
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white">
      <div className="flex items-center gap-2 border-b border-black/[0.05] bg-[#FAFAFA] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="h-2 w-2 rounded-full bg-[#28C840]" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-black/45">
          render.log
        </span>
      </div>
      <div className="space-y-1.5 p-4 font-mono text-[12.5px] leading-relaxed text-black/55">
        {history.map((line, i) =>
          line ? (
            <div key={i} className="opacity-50">
              <span className="text-[#0070F3]">›</span> {line}
            </div>
          ) : null,
        )}
        <div className="text-black">
          <span className="text-[#0070F3]">›</span> {typed}
          <span className="ml-0.5 inline-block h-[1em] w-[7px] -translate-y-[1px] animate-pulse bg-black align-middle" />
        </div>
      </div>
    </div>
  );
}

// ───────────── Feature 3: Compare Table ─────────────

// ───────────── FAQ accordion item ─────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-[#0070F3]"
      >
        <span className="text-[18px] font-semibold leading-snug tracking-[-0.015em]">
          {q}
        </span>
        <span
          className={`mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-black/[0.10] text-black/65 transition-all duration-300 group-hover:border-[#0070F3] group-hover:text-[#0070F3] ${open ? "rotate-45 bg-black text-white" : ""}`}
        >
          <span className="text-[16px] leading-none">+</span>
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="pb-7 pr-12 text-[15.5px] leading-relaxed text-black/65">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

function CompareTable() {
  const rows = [
    { label: "Setup time", agency: "2–3 weeks", us: "15 minutes" },
    { label: "Ad variants / month", agency: "10–15", us: "Up to 250" },
    { label: "Revision rounds", agency: "+$$ each", us: "Unlimited" },
    { label: "Time-zone latency", agency: "8–12 h", us: "0 h" },
    { label: "Monthly retainer", agency: "$5,000", us: "$500" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white">
      <div className="grid grid-cols-3 border-b border-black/[0.05] bg-[#FAFAFA] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">
        <span>Metric</span>
        <span className="text-right">Agency</span>
        <span className="text-right text-black">Converza</span>
      </div>
      <div className="divide-y divide-black/[0.05]">
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-3 items-center px-5 py-3.5 text-[14px]"
          >
            <span className="text-black/65">{r.label}</span>
            <span className="text-right font-mono text-[13px] tabular-nums text-black/45 line-through decoration-black/20">
              {r.agency}
            </span>
            <span className="text-right font-mono text-[13px] font-medium tabular-nums text-black">
              {r.us}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-3 items-center bg-[#FAFAFA] px-5 py-3.5 text-[14px]">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/45">
            Delta
          </span>
          <span className="col-span-2 text-right text-[15px] font-semibold tracking-tight">
            <span className="text-[#0070F3]">10×</span> the cadence at{" "}
            <span className="text-[#0070F3]">1/10</span> the cost.
          </span>
        </div>
      </div>
    </div>
  );
}
