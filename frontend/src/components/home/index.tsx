import React from "react";
import UrlInput from "./url-input";
import { Card, CardContent, CardHeader } from "../ui/card";

const HomePageComponent = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="gap-2 pb-5">
          <p className="font-mono text-[10px] font-semibold tracking-[0.25em] text-primary uppercase">
            spotdl
          </p>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              Spotify to MP3
            </h1>
            <p className="text-xs text-muted-foreground">
              Paste a track or playlist link to download.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <UrlInput />
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePageComponent;
