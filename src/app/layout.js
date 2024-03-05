import { Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Spotify Downloader",
  description: "Easily download spotify playlists or tracks.",
  keywords: ["Spotify", "Spotify Downloader", "Portfolio", "My Work"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="w-full h-full fixed -z-10">
          <div className="absolute bottom-0 md:bottom-1/4 left-0 md:left-1/3 w-44 h-44 bg-accent rounded-full blur-[180px]" />
          <div className="absolute bottom-2/3 left-[100px] w-24 h-24 bg-accent rounded-full blur-[150px] hidden md:block" />
          <div className="absolute top-10 right-24 w-32 h-32 bg-accent rounded-full blur-[150px]" />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
