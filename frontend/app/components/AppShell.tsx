"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme, THEMES } from "../context/ThemeContext";
import {
  HeartPulse,
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  BookOpen,
  FileText,
  UserCircle2,
  LogOut,
  Palette,
  Menu,
  X,
  Shield,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/Button";
import { MessageCircle, SendHorizonal } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

function ProfileMenuItem({
  icon,
  label,
  onClick,
  withBorder = false,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  withBorder?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2, backgroundColor: "var(--hc-soft)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
      className="w-full px-4 py-3 text-left text-sm font-semibold flex items-center gap-2 transition cursor-pointer focus:outline-none focus-visible:ring-2"
      style={{
        color: danger ? "#dc2626" : "var(--hc-text)",
        borderTop: withBorder ? "1px solid var(--hc-border)" : "none",
        borderColor: "var(--hc-border)",
      }}
    >
      <span style={{ color: danger ? "#dc2626" : "var(--hc-accent)" }}>{icon}</span>
      {label}
    </motion.button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: authLogout } = useAuth();

  const hideHeader =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const nav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Screening", href: "/diagnosis", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Assistant", href: "/chat", icon: <MessageSquare className="h-4 w-4" /> },
    { label: "Blogs", href: "/blogs", icon: <BookOpen className="h-4 w-4" /> },
    { label: "Reports", href: "/reports", icon: <FileText className="h-4 w-4" /> },
    { label: "History", href: "/history", icon: <ClipboardList className="h-4 w-4" /> },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const { themeKey, cycleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [assistantOpen, setAssistantOpen] = React.useState(false);
  const [assistantDraft, setAssistantDraft] = React.useState("");
  const [assistantMsgs, setAssistantMsgs] = React.useState<
    { role: "user" | "bot"; text: string }[]
  >([
    {
      role: "bot",
      text: "Hi! I’m your HealthConnect assistant. Ask me anything about your results or next steps.",
    },
  ]);
  const [assistantLoading, setAssistantLoading] = React.useState(false);
  const assistantScrollerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = assistantScrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [assistantMsgs, assistantLoading, assistantOpen]);

  async function sendAssistantMessage(text?: string) {
    const content = (text ?? assistantDraft).trim();
    if (!content || assistantLoading) return;

    setAssistantDraft("");
    setAssistantLoading(true);
    setAssistantMsgs((m) => [...m, { role: "user", text: content }]);

    try {
      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: content }),
      });

      const raw = await res.text();
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const friendlyError =
          data?.message ||
          data?.error ||
          raw ||
          "Sorry — I couldn't reach the assistant service.";

        throw new Error(friendlyError);
      }

      const reply =
        (data?.answer ?? data?.reply ?? data?.message ?? "").toString().trim() ||
        "(No response)";

      setAssistantMsgs((m) => [...m, { role: "bot", text: reply }]);
    } catch (e: any) {
      const msg =
        e?.message?.trim() ||
        "Sorry — I couldn't reach the assistant service.";

      setAssistantMsgs((m) => [
        ...m,
        {
          role: "bot",
          text: `Sorry — I couldn't reach the assistant service.\n\n${msg}`,
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  }

  async function logout() {
    setProfileOpen(false);
    await authLogout();
  }

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  const isAdmin = (user?.roles || []).some((r) => String(r).toLowerCase() === "admin");
  const isDoctor = (user?.roles || []).some((r) => String(r).toLowerCase() === "doctor");
  const roleLabel = isAdmin ? "Admin" : isDoctor ? "Doctor" : "Patient";

  React.useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null);
      return;
    }
    try {
      const key = `hc_avatar_${user.id}`;
      const v = localStorage.getItem(key);
      setAvatarUrl(v);
    } catch {
      setAvatarUrl(null);
    }
  }, [user?.id, pathname]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-profile-menu]")) setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileOpen]);

  if (hideHeader) return <>{children}</>;

  const hoverBg =
    themeKey === "playful"
      ? "rgba(255,255,255,0.07)"
      : themeKey === "sakura"
        ? "rgba(236,72,153,0.10)"
        : "rgba(14,165,164,0.08)";

  const activeBg =
    themeKey === "playful" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.04)";

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--hc-bg)", color: "var(--hc-text)" }}
    >
      <header
        className="w-full"
        style={{
          background: "var(--hc-surface)",
          borderBottom: "1px solid var(--hc-border)",
        }}
      >
        <div className="mx-auto max-w-[90rem] px-3 py-3 md:px-4">
          <div className="flex items-center justify-between gap-3">
            <motion.button
              onClick={() => router.push("/dashboard")}
              whileHover={{
                backgroundColor: hoverBg,
                boxShadow:
                  themeKey === "playful"
                    ? "0 0 0 6px rgba(255,255,255,0.06)"
                    : themeKey === "sakura"
                      ? "0 0 0 6px rgba(236,72,153,0.06)"
                      : "0 0 0 6px rgba(14,165,164,0.05)",
              }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 transition focus:outline-none"
              style={{ background: "transparent" }}
            >
              <motion.div whileHover={{ rotate: 6 }} className="rounded-xl p-2">
                <HeartPulse className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
              </motion.div>
              <div className="text-left leading-tight">
                <div className="text-sm font-semibold">HealthConnect</div>
                <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
                  Patient portal
                </div>
              </div>
            </motion.button>

            <nav className="hidden lg:flex items-center justify-center gap-1">
              {nav.map((n) => {
                const active = isActive(n.href);
                return (
                  <motion.button
                    key={n.label}
                    onClick={(e) => {
                      router.push(n.href);
                      (e.currentTarget as HTMLButtonElement).blur();
                    }}
                    whileHover={{ y: -1, backgroundColor: hoverBg }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none"
                    style={{
                      color: "var(--hc-text)",
                      background: active ? activeBg : "transparent",
                      boxShadow: active ? "inset 0 0 0 1px var(--hc-border)" : "none",
                    }}
                    title={n.label}
                  >
                    <span style={{ color: "var(--hc-accent)" }}>{n.icon}</span>
                    {n.label}
                  </motion.button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2">
                <div style={{ width: 180 }}>
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="secondary"
                      onClick={cycleTheme}
                      iconLeft={<Palette className="h-4 w-4" />}
                      className="w-full"
                    >
                      <span className="truncate">{THEMES[themeKey].name}</span>
                    </Button>
                  </motion.div>
                </div>

                <div className="relative" data-profile-menu>
                  <motion.button
                    whileHover={{ y: -1, backgroundColor: hoverBg }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-2xl px-3 py-2 border"
                    style={{
                      borderColor: "var(--hc-border)",
                      background: profileOpen ? "var(--hc-soft)" : "transparent",
                    }}
                    aria-label="Open profile menu"
                  >
                    <div
                      className="h-9 w-9 rounded-xl overflow-hidden border grid place-items-center"
                      style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle2 className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
                      )}
                    </div>

                    <div className="text-left leading-tight">
                      <div className="text-sm font-semibold">{user?.name || roleLabel}</div>
                      <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
                        {roleLabel} · Signed in
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: profileOpen ? 180 : 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <ChevronDown className="h-4 w-4" style={{ color: "var(--hc-muted)" }} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.14, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl border shadow-sm overflow-hidden z-50"
                        style={{
                          borderColor: "var(--hc-border)",
                          background: "var(--hc-surface)",
                          boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
                        }}
                      >
                        <ProfileMenuItem
                          icon={<Settings className="h-4 w-4" />}
                          label="Profile"
                          onClick={() => {
                            router.push("/profile");
                            setProfileOpen(false);
                          }}
                        />

                        {isAdmin ? (
                          <ProfileMenuItem
                            icon={<Shield className="h-4 w-4" />}
                            label="Admin"
                            withBorder
                            onClick={() => {
                              router.push("/admin");
                              setProfileOpen(false);
                            }}
                          />
                        ) : null}

                        {!isDoctor && !user?.doctor_status ? (
                          <ProfileMenuItem
                            icon={<HeartPulse className="h-4 w-4" />}
                            label="Apply for Doctor"
                            withBorder
                            onClick={() => {
                              router.push("/doctor/apply");
                              setProfileOpen(false);
                            }}
                          />
                        ) : null}

                        <ProfileMenuItem
                          icon={<LogOut className="h-4 w-4" />}
                          label="Logout"
                          withBorder
                          danger
                          onClick={logout}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              <div className="lg:hidden">
                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "tween", duration: 0.12 }}
                >
                  <Button
                    variant="secondary"
                    onClick={() => setMobileOpen((v) => !v)}
                    iconLeft={mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  >
                    Menu
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {mobileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="lg:hidden mt-3 rounded-2xl border p-3"
                style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
              >
                <div className="grid gap-2">
                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="secondary"
                      onClick={cycleTheme}
                      iconLeft={<Palette className="h-4 w-4" />}
                      className="w-full"
                    >
                      {THEMES[themeKey].name}
                    </Button>
                  </motion.div>

                  <div className="grid gap-1">
                    {nav.map((n) => {
                      const active = isActive(n.href);
                      return (
                        <motion.button
                          key={n.label}
                          onClick={() => router.push(n.href)}
                          whileHover={{ x: 2, backgroundColor: hoverBg }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
                          className="w-full rounded-xl px-3 py-3 text-left text-sm font-semibold border"
                          style={{
                            borderColor: "var(--hc-border)",
                            background: active ? activeBg : "transparent",
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span style={{ color: "var(--hc-accent)" }}>{n.icon}</span>
                            {n.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-2 rounded-xl border p-3" style={{ borderColor: "var(--hc-border)" }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-9 w-9 rounded-xl overflow-hidden border grid place-items-center"
                        style={{ borderColor: "var(--hc-border)", background: "var(--hc-surface)" }}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <UserCircle2 className="h-5 w-5" style={{ color: "var(--hc-accent)" }} />
                        )}
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm font-semibold">{user?.name || roleLabel}</div>
                        <div className="text-xs" style={{ color: "var(--hc-muted)" }}>
                          {roleLabel} · Signed in
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="secondary"
                          onClick={() => router.push("/profile")}
                          iconLeft={<Settings className="h-4 w-4" />}
                        >
                          Profile
                        </Button>
                      </motion.div>

                      {isAdmin ? (
                        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="mt-2 text-left">
                          <Button
                            variant="secondary"
                            onClick={() => router.push("/admin")}
                            iconLeft={<Shield className="h-4 w-4" />}
                          >
                            Admin
                          </Button>
                        </motion.div>
                      ) : null}

                      {!isDoctor && !user?.doctor_status ? (
                        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="mt-2 text-left">
                          <Button
                            variant="secondary"
                            onClick={() => router.push("/doctor/apply")}
                            iconLeft={<HeartPulse className="h-4 w-4" />}
                          >
                            Apply for Doctor
                          </Button>
                        </motion.div>
                      ) : null}

                      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="mt-2 text-left">
                        <Button variant="ghost" onClick={logout} iconLeft={<LogOut className="h-4 w-4" />}>
                          Logout
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <main className="mx-auto max-w-[90rem] px-3 py-6 md:px-4">{children}</main>

      {/* Floating Assistant */}
      <div className="fixed bottom-5 right-5 z-[120]">
        <AnimatePresence>
          {assistantOpen && (
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
                mass: 0.9,
              }}
              className="absolute bottom-16 right-0 w-[360px] overflow-hidden rounded-3xl border shadow-xl"
              style={{
                background: "var(--hc-surface)",
                borderColor: "var(--hc-border)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom: "1px solid var(--hc-border)",
                  background: "rgba(100,116,139,0.05)",
                }}
              >
                <span className="text-sm font-semibold">
                  {themeKey === "sakura" ? "Miku Assistant 🌸" : "Assistant"}
                </span>

                <button
                  onClick={() => setAssistantOpen(false)}
                  className="rounded-full p-1 transition"
                  style={{ color: "var(--hc-muted)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                ref={assistantScrollerRef}
                className="max-h-[420px] overflow-y-auto px-4 py-4 space-y-3"
              >
                {assistantMsgs.map((m, i) => {
                  const isBot = m.role === "bot";
                  return (
                    <div
                      key={i}
                      className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className="max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap"
                        style={{
                          background: isBot ? "rgba(100,116,139,0.08)" : "var(--hc-accent)",
                          color: isBot ? "var(--hc-text)" : "#fff",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}

                {assistantLoading && (
                  <div className="flex justify-start">
                    <div
                      className="max-w-[85%] rounded-2xl px-3 py-2 text-sm"
                      style={{
                        background: "rgba(100,116,139,0.08)",
                        color: "var(--hc-text)",
                      }}
                    >
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              <div
                className="border-t px-3 py-3"
                style={{ borderColor: "var(--hc-border)" }}
              >
                <div className="flex items-center gap-2">
                  <input
                    value={assistantDraft}
                    onChange={(e) => setAssistantDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendAssistantMessage();
                    }}
                    placeholder="Ask something..."
                    className="flex-1 rounded-2xl border px-3 py-2 text-sm outline-none"
                    style={{
                      borderColor: "var(--hc-border)",
                      background: "transparent",
                      color: "var(--hc-text)",
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={() => sendAssistantMessage()}
                    iconLeft={<SendHorizonal className="h-4 w-4" />}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setAssistantOpen((v) => !v)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="grid h-14 w-14 place-items-center rounded-full shadow-lg"
          style={{
            background: "var(--hc-accent)",
            color: "#fff",
          }}
          aria-label="Open assistant"
        >
          {assistantOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </motion.button>
      </div>
    </div>
  );
}