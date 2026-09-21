import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/shell/app-shell";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: "spotdl",
    template: "%s · spotdl",
  },
  description: "paste a spotify link, get tagged mp3s.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const CONTRACT = `<!--
THESIS: a download tool that behaves like software you keep, not a link-in /
file-out page. It refuses the category's centred hero on black: downloads are
objects you leave running and come back to.
OWN-WORLD: dark-first neutrals (#0F0F0F canvas, #161616 surface), bordered at
rest with shadow reserved for things that truly float, an 8/12/16 radius scale,
Geist with tabular mono on every number, Spotify green on fills and progress only.
STORY: paste a link, see the real release with its artwork and metadata, choose
format and quality, start a job that keeps running while you browse for the next.
FIRST VIEWPORT: slim top bar with the paste field always present; on home a
generous centred field over a recents list; on a release, cover art and title
left, primary download right, tracklist below, jobs docked right.
FORM: the category standard, taken as the standing exit over the roll's assigned
candidate 4 (Catalogue Number); seed key 9e191897.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.
-->`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* A JSX comment is compile-time only, so the direction contract is
            emitted as a real HTML comment that survives the production build
            and can be audited by grepping the built output for the seed key. */}
        <div hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: CONTRACT }} />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
