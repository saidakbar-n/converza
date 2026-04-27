import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Instrument_Serif } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Converza — A 19-node AI workforce for e-commerce",
  description:
    "Replace your $5,000 marketing agency. Launch 60 high-volume video ads in 24 hours. Pilot from $500.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${geist.variable} ${mono.variable} ${serif.variable} relative min-h-screen bg-white text-black antialiased`}
      style={{ fontFamily: "var(--font-geist), Inter, system-ui, sans-serif" }}
    >
      {/* Faint architectural grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse at center, black 0%, black 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, black 60%, transparent 100%)",
        }}
      />
      {/* Override the global dark body bg for marketing routes. */}
      <style>{`
        html, body { background: #FFFFFF !important; color: #000000 !important; }
        html { color-scheme: light !important; }
      `}</style>
      {/* Global noise texture */}
      <svg
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.04] mix-blend-multiply"
      >
        <filter id="converza-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#converza-noise)" />
      </svg>
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
