"use client";
import { Analytics } from "@vercel/analytics/react";
import { DownloaderProvider } from "@/context/Download";

const Providers = ({ children }) => {
  return (
    <DownloaderProvider>
      {children}
      <Analytics />
    </DownloaderProvider>
  );
};

export default Providers;
