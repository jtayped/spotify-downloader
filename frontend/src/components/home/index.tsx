import React from "react";
import UrlInput from "./url-input";
import { Card, CardContent, CardHeader } from "../ui/card";

const HomePageComponent = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-lg">
        <CardHeader>
          <h1 className="text-3xl font-bold">spotify downloader</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eos soluta
            impedit perferendis expedita, qui saepe.
          </p>
        </CardHeader>
        <CardContent>
          <UrlInput />
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePageComponent;
