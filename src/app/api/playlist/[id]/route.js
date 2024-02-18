import { downloadPlaylist, getPlaylist } from "@/lib/downloader";
import { NextResponse } from "next/server";
const fs = require("fs");
const path = require("path");

export const GET = async (request, { params }) => {
  const id = params.id;

  if (!id)
    return NextResponse.json(
      { message: "Provide a playlist ID" },
      { status: 400 }
    );

  try {
    const playlist = await getPlaylist(id);
    return NextResponse.json(playlist);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "There has been an error downloading the playlist" },
      { status: 500 }
    );
  }
};
