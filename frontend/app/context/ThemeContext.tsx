"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeKey = "calm" | "sakura" | "playful";

export const THEMES: Record<
    ThemeKey,
    {
        name: string;
        accent: string;
        bg: string;
        surface: string;
        text: string;
        muted: string;
        border: string;
    }
> = {
    calm: {
        name: "Calm Clinical",
        accent: "#0EA5A4",
        bg: "#F7FAFC",
        surface: "#FFFFFF",
        text: "#0F172A",
        muted: "#64748B",
        border: "rgba(148, 163, 184, 0.35)",
    },
    sakura: {
        name: "Sakura Light",
        accent: "#f26f9b",
        bg: "#FFF5F8",              
        surface: "#FFFDFE",         
        text: "#4A2E39",            
        muted: "#A06A7C",           
        border: "rgba(244, 143, 177, 0.22)",
    },
    playful: {
        name: "Playful Tech",
        accent: "#22C55E",
        bg: "#0B1220",
        surface: "#0F172A",
        text: "#E5E7EB",
        muted: "#9CA3AF",
        border: "rgba(255, 255, 255, 0.14)",
    },
};

interface ThemeContextValue {
    themeKey: ThemeKey;
    setThemeKey: (key: ThemeKey) => void;
    cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    themeKey: "calm",
    setThemeKey: () => { },
    cycleTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeKey, setThemeKeyState] = useState<ThemeKey>("calm");

    // Load saved theme from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("hc_theme") as ThemeKey | null;
            if (saved && THEMES[saved]) {
                setThemeKeyState(saved);
            }
        } catch { }
    }, []);

    // Apply CSS variables whenever the theme changes
    useEffect(() => {
        const t = THEMES[themeKey];

        document.documentElement.style.setProperty("--hc-accent", t.accent);
        document.documentElement.style.setProperty("--hc-bg", t.bg);
        document.documentElement.style.setProperty("--hc-surface", t.surface);
        document.documentElement.style.setProperty("--hc-text", t.text);
        document.documentElement.style.setProperty("--hc-muted", t.muted);
        document.documentElement.style.setProperty("--hc-border", t.border);

        document.documentElement.style.setProperty("--accent", t.accent);
        document.documentElement.style.setProperty("--surface", t.surface);
        document.documentElement.style.setProperty("--text", t.text);
        document.documentElement.style.setProperty("--muted", t.muted);
        document.documentElement.style.setProperty("--borderSoft", t.border);

        try {
            localStorage.setItem("hc_theme", themeKey);
        } catch { }
    }, [themeKey]);

    const setThemeKey = (key: ThemeKey) => {
        if (THEMES[key]) setThemeKeyState(key);
    };

    const cycleTheme = () => {
        setThemeKeyState((k) =>
            k === "calm" ? "sakura" : k === "sakura" ? "playful" : "calm"
        );
    };

    return (
        <ThemeContext.Provider value={{ themeKey, setThemeKey, cycleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
