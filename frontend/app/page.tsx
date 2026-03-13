"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Activity,
  Brain,
  Stethoscope,
  Target,
  Eye,
  Users,
  FileHeart,
  MessageSquareHeart,
  BadgeCheck,
  Globe2,
  ChevronDown,
  Pill,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";
import { THEMES, useTheme } from "./context/ThemeContext";

const highlights = [
  {
    icon: FileHeart,
    title: "AI-based heart screening",
    text: "A guided experience that helps users understand possible heart disease risk in a simple and approachable way.",
  },
  {
    icon: MessageSquareHeart,
    title: "Supportive health guidance",
    text: "The platform is designed to explain results clearly so users do not feel lost after screening.",
  },
  {
    icon: LayoutDashboard,
    title: "Structured user journey",
    text: "From first visit to screening, history, and insights, the product aims to feel clean, calm, and easy to navigate.",
  },
  {
    icon: ShieldCheck,
    title: "Safer digital experience",
    text: "Sensitive health-related functions are intended to be handled in a more organized and protected environment.",
  },
];

const goals = [
  "Provide an accessible web-based heart disease prediction and well-being platform.",
  "Help users become more aware of possible cardiovascular risk factors earlier.",
  "Present health information in a clearer and less intimidating user experience.",
  "Encourage users to take the next step toward healthier habits and further consultation.",
];

const sdgCards = [
  {
    number: "03",
    title: "Good Health and Well-Being",
    text: "HealthConnect directly supports preventive awareness by helping users screen, understand, and reflect on heart health risk factors.",
  },
  {
    number: "09",
    title: "Industry, Innovation and Infrastructure",
    text: "The project uses modern digital technology and machine learning as part of a practical healthcare innovation experience.",
  },
  {
    number: "10",
    title: "Reduced Inequalities",
    text: "A clean and user-friendly web interface can help make early screening experiences feel more reachable to more users.",
  },
];

export default function HomePage() {
  const { themeKey, cycleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  const heroRef = useRef<HTMLElement | null>(null);
  const visionRef = useRef<HTMLElement | null>(null);
  const goalsRef = useRef<HTMLElement | null>(null);
  const highlightsRef = useRef<HTMLElement | null>(null);
  const sdgRef = useRef<HTMLElement | null>(null);
  const finalRef = useRef<HTMLElement | null>(null);

  const [sectionOffsets, setSectionOffsets] = useState({
    hero: 0,
    vision: 0,
    goals: 0,
    highlights: 0,
    sdg: 0,
    final: 0,
  });

  useEffect(() => {
    const measureSections = () => {
      setSectionOffsets({
        hero: heroRef.current?.offsetTop ?? 0,
        vision: visionRef.current?.offsetTop ?? 0,
        goals: goalsRef.current?.offsetTop ?? 0,
        highlights: highlightsRef.current?.offsetTop ?? 0,
        sdg: sdgRef.current?.offsetTop ?? 0,
        final: finalRef.current?.offsetTop ?? 0,
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    handleScroll();
    measureSections();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measureSections);

    const timer = setTimeout(measureSections, 120);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measureSections);
      clearTimeout(timer);
    };
  }, []);

  const heroGlow =
    themeKey === "playful"
      ? "rgba(34,197,94,0.18)"
      : themeKey === "sakura"
        ? "rgba(242,111,155,0.20)"
        : "rgba(14,165,164,0.18)";

  const secondaryGlow =
    themeKey === "playful"
      ? "rgba(59,130,246,0.12)"
      : themeKey === "sakura"
        ? "rgba(251,146,60,0.12)"
        : "rgba(56,189,248,0.12)";

  const showSakuraMiku = themeKey === "sakura";

  const activeScroll = scrollY + 220;

  const inFinal = activeScroll >= sectionOffsets.final - 320;
  const inSDG = !inFinal && activeScroll >= sectionOffsets.sdg - 140;
  const inHighlights =
    !inFinal && !inSDG && activeScroll >= sectionOffsets.highlights - 140;
  const inGoals =
    !inFinal &&
    !inSDG &&
    !inHighlights &&
    activeScroll >= sectionOffsets.goals - 120;
  const inVision =
    !inFinal &&
    !inSDG &&
    !inHighlights &&
    !inGoals &&
    activeScroll >= sectionOffsets.vision - 140;

  const heroDistance = Math.max(
    1,
    (sectionOffsets.vision || 900) - (sectionOffsets.hero || 0)
  );
  const visionDistance = Math.max(
    1,
    (sectionOffsets.goals || 1600) - (sectionOffsets.vision || 900)
  );
  const goalsDistance = Math.max(
    1,
    (sectionOffsets.highlights || 2300) - (sectionOffsets.goals || 1600)
  );
  const highlightsDistance = Math.max(
    1,
    (sectionOffsets.sdg || 3200) - (sectionOffsets.highlights || 2300)
  );
  const sdgDistance = Math.max(
    1,
    (sectionOffsets.final || 4100) - (sectionOffsets.sdg || 3200)
  );

  const heroProgress = Math.max(0, Math.min(1, scrollY / heroDistance));
  const visionProgress = Math.max(
    0,
    Math.min(1, (scrollY - sectionOffsets.vision + 60) / visionDistance)
  );
  const goalsProgress = Math.max(
    0,
    Math.min(1, (scrollY - sectionOffsets.goals + 40) / goalsDistance)
  );
  const highlightsProgress = Math.max(
    0,
    Math.min(1, (scrollY - sectionOffsets.highlights + 40) / highlightsDistance)
  );
  const sdgProgress = Math.max(
    0,
    Math.min(1, (scrollY - sectionOffsets.sdg + 40) / sdgDistance)
  );

  let mikuTop = sectionOffsets.hero + 10 + heroProgress * 120;
  let mikuRight: string | "auto" = "clamp(0rem, 2vw, 2rem)";
  let mikuLeft: string | "auto" = "auto";
  let mikuWidth = 250;
  let mikuOpacity = 0.96;
  let mikuRotate = 2;
  let mikuZIndex = 18;

  if (inVision) {
    mikuTop = sectionOffsets.vision + 20 + visionProgress * 140;
    mikuRight = "clamp(0rem, 2vw, 2rem)";
    mikuLeft = "auto";
    mikuWidth = 230;
    mikuOpacity = 1;
    mikuRotate = -4;
    mikuZIndex = 18;
  } else if (inGoals) {
    mikuTop = sectionOffsets.goals + 90 + goalsProgress * 120;
    mikuRight = "auto";
    mikuLeft = "clamp(-10rem, -5vw, -2rem)";
    mikuWidth = 620;
    mikuOpacity = 0.36;
    mikuRotate = -12;
    mikuZIndex = 0;
  } else if (inHighlights) {
    mikuTop = sectionOffsets.highlights + 120 + highlightsProgress * 80;
    mikuRight = "auto";
    mikuLeft = "clamp(-9rem, -4vw, -1rem)";
    mikuWidth = 560;
    mikuOpacity = 0.28;
    mikuRotate = -10;
    mikuZIndex = 0;
  } else if (inSDG) {
    mikuTop = sectionOffsets.sdg + 80 + sdgProgress * 120;
    mikuRight = "auto";
    mikuLeft = "clamp(-8rem, -3vw, 0rem)";
    mikuWidth = 560;
    mikuOpacity = 0.3;
    mikuRotate = -8;
    mikuZIndex = 0;
  } else if (inFinal) {
    mikuTop = sectionOffsets.final - 10;
    mikuRight = "-60px";
    mikuLeft = "auto";
    mikuWidth = 360;
    mikuOpacity = 1;
    mikuRotate = 2;
    mikuZIndex = 20;
  }

  const mikuFloat = Math.sin(scrollY / 140) * (inGoals || inHighlights || inSDG ? 10 : 6);

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--hc-bg)", color: "var(--hc-text)" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 right-[-6rem] h-[24rem] w-[24rem] rounded-full blur-3xl"
          style={{ background: heroGlow }}
        />
        <div
          className="absolute top-[28rem] left-[-5rem] h-[20rem] w-[20rem] rounded-full blur-3xl"
          style={{ background: secondaryGlow }}
        />
        <div
          className="absolute bottom-[-8rem] right-[-4rem] h-[22rem] w-[22rem] rounded-full blur-3xl"
          style={{ background: heroGlow }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--hc-border) 1px, transparent 1px), linear-gradient(to bottom, var(--hc-border) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {showSakuraMiku && (
          <div className="pointer-events-none absolute inset-x-0 top-0 hidden lg:block">
            <motion.div
              aria-hidden="true"
              className="absolute"
              animate={{
                top: mikuTop,
                opacity: mikuOpacity,
                rotate: mikuRotate,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                right: mikuRight,
                left: mikuLeft,
                zIndex: mikuZIndex,
              }}
            >
              <div className="relative">
                {!(inGoals || inHighlights || inSDG) && (
                  <div
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{
                      background: "rgba(242,111,155,0.18)",
                      transform: "translate(0.5rem, 1.5rem) scale(0.92)",
                    }}
                  />
                )}

                <img
                  src="/MikuMagicalCure.png"
                  alt=""
                  className="select-none"
                  style={{
                    width: `${mikuWidth}px`,
                    transform: `translateY(${mikuFloat}px)`,
                    filter:
                      inGoals || inHighlights || inSDG
                        ? "drop-shadow(0 36px 72px rgba(242,111,155,0.12))"
                        : "drop-shadow(0 24px 48px rgba(242,111,155,0.22))",
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}

        <header
          className="sticky top-4 z-30 mb-10 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 backdrop-blur-xl sm:px-5"
          style={{
            background: "color-mix(in srgb, var(--hc-surface) 84%, transparent)",
            borderColor: "var(--hc-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-2xl border p-2.5"
              style={{
                borderColor: "var(--hc-border)",
                background:
                  "color-mix(in srgb, var(--hc-accent) 10%, transparent)",
              }}
            >
              <HeartPulse className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
            </div>

            <div>
              <div className="text-sm font-semibold sm:text-base">HealthConnect</div>
              <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
                Heart Disease Prediction & Well-Being System
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleTheme}
              className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold"
              style={{
                borderColor: "var(--hc-border)",
                background: "var(--hc-surface)",
                color: "var(--hc-text)",
              }}
            >
              {THEMES[themeKey].name}
            </button>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold"
              style={{
                borderColor: "var(--hc-border)",
                background: "var(--hc-surface)",
                color: "var(--hc-text)",
              }}
            >
              Login
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--hc-accent)" }}
            >
              Get started
            </Link>
          </div>
        </header>

        <section
          ref={heroRef}
          className="relative grid min-h-[88vh] items-center gap-10 pb-12 pt-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:pb-20"
        >
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:text-sm"
              style={{
                borderColor: "var(--hc-border)",
                background:
                  "color-mix(in srgb, var(--hc-surface) 76%, transparent)",
                color: "var(--hc-muted)",
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: "var(--hc-accent)" }} />
              Human-centered digital healthcare experience
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5, ease: "easeOut" }}
              className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
            >
              A smarter way to explore
              <span style={{ color: "var(--hc-accent)" }}> heart health </span>
              with clarity, care, and confidence.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
              className="mt-5 max-w-2xl text-base leading-7 sm:text-lg"
              style={{ color: "var(--hc-muted)" }}
            >
              HealthConnect is designed as a modern web platform that blends heart disease prediction,
              health awareness, supportive guidance, and a calm user experience into one cohesive system.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm sm:text-base"
                style={{ background: "var(--hc-accent)" }}
              >
                Explore platform
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#vision"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold sm:text-base"
                style={{
                  borderColor: "var(--hc-border)",
                  background: "var(--hc-surface)",
                  color: "var(--hc-text)",
                }}
              >
                See project vision
                <ChevronDown className="h-4 w-4" style={{ color: "var(--hc-accent)" }} />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.5, ease: "easeOut" }}
              className="mt-8 grid gap-3 sm:grid-cols-2"
            >
              {[
                "Clean and reassuring interface",
                "Aligned with healthcare and student FYP goals",
                "Built around awareness and accessibility",
                "Ready for richer dashboard and assistant flows",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: "var(--hc-border)",
                    background:
                      "color-mix(in srgb, var(--hc-surface) 88%, transparent)",
                  }}
                >
                  <BadgeCheck className="h-5 w-5 shrink-0" style={{ color: "var(--hc-accent)" }} />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.55, ease: "easeOut" }}
            className="relative"
          >
            <div
              className="absolute inset-0 -z-10 rounded-[2rem] blur-3xl"
              style={{
                background: heroGlow,
                transform: "translateY(2rem) scale(0.95)",
              }}
            />

            <div
              className="rounded-[2rem] border p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-5"
              style={{
                background:
                  "color-mix(in srgb, var(--hc-surface) 90%, transparent)",
                borderColor: "var(--hc-border)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--hc-border)",
                  background:
                    "color-mix(in srgb, var(--hc-bg) 55%, var(--hc-surface))",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="text-xs font-semibold uppercase tracking-[0.16em]"
                      style={{ color: "var(--hc-muted)" }}
                    >
                      Project identity
                    </div>
                    <div className="mt-2 text-2xl font-semibold">HealthConnect</div>
                  </div>
                  <div
                    className="rounded-2xl p-3"
                    style={{ background: "color-mix(in srgb, var(--hc-accent) 12%, transparent)" }}
                  >
                    <Activity className="h-6 w-6" style={{ color: "var(--hc-accent)" }} />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Brain, label: "Prediction" },
                    { icon: Stethoscope, label: "Well-being" },
                    { icon: Users, label: "User-centered" },
                    { icon: Globe2, label: "Accessible web app" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="rounded-2xl border p-4"
                        style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
                      >
                        <Icon className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
                        <div className="mt-3 text-sm font-semibold">{item.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="mt-4 rounded-2xl border p-4"
                style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
              >
                <div
                  className="text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--hc-muted)" }}
                >
                  Core direction
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "Improve early awareness of cardiovascular risk.",
                    "Make screening information easier to understand.",
                    "Create a healthcare experience that feels modern and approachable.",
                  ].map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-xl border px-4 py-3"
                      style={{ borderColor: "var(--hc-border)" }}
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--hc-accent)" }} />
                      <p className="text-sm" style={{ color: "var(--hc-muted)" }}>
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section ref={visionRef} id="vision" className="scroll-mt-28 py-10 sm:py-14">
          <div className="mb-6 max-w-2xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: "var(--hc-border)",
                color: "var(--hc-muted)",
                background: "var(--hc-surface)",
              }}
            >
              <Eye className="h-4 w-4" style={{ color: "var(--hc-accent)" }} />
              Vision
            </div>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              A platform that makes heart health feel clearer and more approachable
            </h2>
            <p className="mt-3 text-sm leading-7 sm:text-base" style={{ color: "var(--hc-muted)" }}>
              The vision behind HealthConnect is to create a digital healthcare experience where users can interact
              with screening tools, understand their outcomes, and feel supported instead of overwhelmed. The platform
              aims to combine technology with empathy so healthcare information feels more usable, modern, and human.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Vision",
                text: "To build a modern health platform that helps users understand heart risk and take action with more confidence.",
              },
              {
                icon: Target,
                title: "Mission",
                text: "To deliver a clean, intelligent, and supportive screening experience using web technology and predictive logic.",
              },
              {
                icon: Users,
                title: "User focus",
                text: "To design around clarity, reassurance, and accessibility for people who may not have medical knowledge.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border p-6"
                  style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
                >
                  <div
                    className="inline-flex rounded-2xl border p-3"
                    style={{
                      borderColor: "var(--hc-border)",
                      background: "color-mix(in srgb, var(--hc-accent) 10%, transparent)",
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7" style={{ color: "var(--hc-muted)" }}>
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section ref={goalsRef} className="relative py-10 sm:py-14">
          <div className="mb-6 max-w-2xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: "var(--hc-border)",
                color: "var(--hc-muted)",
                background: "var(--hc-surface)",
              }}
            >
              <Target className="h-4 w-4" style={{ color: "var(--hc-accent)" }} />
              Goals
            </div>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Project goals and purpose</h2>
            <p className="mt-3 text-sm leading-7 sm:text-base" style={{ color: "var(--hc-muted)" }}>
              These sections help explain the purpose of the system beyond visuals alone, so your landing page feels
              more complete, academic, and presentation-ready.
            </p>
          </div>

          <div className="relative z-10 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div
              className="rounded-[1.8rem] border p-6"
              style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
            >
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div
                    key={goal}
                    className="flex items-start gap-4 rounded-2xl border p-4"
                    style={{ borderColor: "var(--hc-border)" }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      style={{
                        background: "color-mix(in srgb, var(--hc-accent) 12%, transparent)",
                        color: "var(--hc-accent)",
                      }}
                    >
                      0{index + 1}
                    </div>
                    <p className="text-sm leading-7" style={{ color: "var(--hc-muted)" }}>
                      {goal}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: Pill,
                  title: "Healthcare relevance",
                  text: "The project focuses on one of the most important modern health concerns: cardiovascular awareness and prevention.",
                },
                {
                  icon: Brain,
                  title: "Technology integration",
                  text: "It combines predictive technology, interface design, and structured user flow into one real system concept.",
                },
                {
                  icon: BookOpen,
                  title: "FYP storytelling",
                  text: "This section helps your website communicate academic purpose, not just product features.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[1.8rem] border p-6"
                    style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
                    <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7" style={{ color: "var(--hc-muted)" }}>
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section ref={highlightsRef} className="py-10 sm:py-14">
          <div className="mb-6 max-w-2xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: "var(--hc-border)",
                color: "var(--hc-muted)",
                background: "var(--hc-surface)",
              }}
            >
              <Stethoscope className="h-4 w-4" style={{ color: "var(--hc-accent)" }} />
              Highlights
            </div>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">What the platform is trying to achieve</h2>
          </div>

          <div className="relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.06, duration: 0.45, ease: "easeOut" }}
                  className="rounded-[1.6rem] border p-5"
                  style={{
                    borderColor: "var(--hc-border)",
                    background: "color-mix(in srgb, var(--hc-surface) 92%, transparent)",
                  }}
                >
                  <div
                    className="inline-flex rounded-2xl border p-3"
                    style={{
                      borderColor: "var(--hc-border)",
                      background: "color-mix(in srgb, var(--hc-accent) 9%, transparent)",
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--hc-muted)" }}>
                    {item.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section ref={sdgRef} className="py-10 sm:py-14">
          <div className="mb-6 max-w-2xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: "var(--hc-border)",
                color: "var(--hc-muted)",
                background: "var(--hc-surface)",
              }}
            >
              <Globe2 className="h-4 w-4" style={{ color: "var(--hc-accent)" }} />
              SDG Alignment
            </div>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Connecting the project to broader impact</h2>
            <p className="mt-3 text-sm leading-7 sm:text-base" style={{ color: "var(--hc-muted)" }}>
              This section gives your landing page a stronger academic and societal layer by linking the project to
              sustainable development values.
            </p>
          </div>

          <div className="relative z-10 grid gap-4 lg:grid-cols-3">
            {sdgCards.map((item) => (
              <div
                key={item.number}
                className="rounded-[1.9rem] border p-6"
                style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
              >
                <div className="text-sm font-semibold" style={{ color: "var(--hc-accent)" }}>
                  SDG {item.number}
                </div>
                <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--hc-muted)" }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section ref={finalRef} className="relative pb-10 pt-10 sm:pb-14 sm:pt-14">
          <div
            className="relative rounded-[2rem] border px-6 py-8 text-center sm:px-8"
            style={{
              borderColor: "var(--hc-border)",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--hc-accent) 14%, transparent), color-mix(in srgb, var(--hc-surface) 92%, transparent))",
            }}
          >
            <div className="mx-auto max-w-2xl">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: "var(--hc-border)",
                  background: "color-mix(in srgb, var(--hc-surface) 70%, transparent)",
                  color: "var(--hc-muted)",
                }}
              >
                <Sparkles className="h-4 w-4" style={{ color: "var(--hc-accent)" }} />
                Final call to action
              </div>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Experience the project from idea to interface
              </h2>
              <p className="mt-3 text-sm leading-7 sm:text-base" style={{ color: "var(--hc-muted)" }}>
                This landing page now tells the story of the system, its goals, its impact, and its purpose — not just
                the buttons. It is designed to feel more complete for presentation, evaluation, and first impressions.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                  style={{ background: "var(--hc-accent)" }}
                >
                  Continue to platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "var(--hc-border)",
                    background: "var(--hc-surface)",
                    color: "var(--hc-text)",
                  }}
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}