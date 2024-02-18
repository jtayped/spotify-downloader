import { downloadPlaylist } from "@/lib/downloader";
import { NextResponse } from "next/server";
const fs = require("fs");
const path = require("path");

export const POST = async (request) => {
  const { playlist } = await request.json();
  console.log(playlist);

  try {
    // Call downloadPlaylist function to generate the zip file
    const filePath = await downloadPlaylist(playlist);

    // Read the zip file asynchronously
    const fileContent = await fs.promises.readFile(filePath);

    // Set response headers
    const headers = {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${path.basename(
        filePath
      )}"`,
      "Content-Length": fileContent.length, // Ensure proper content length
    };

    // Return the file content as a blob
    return new Response(fileContent, { headers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "There has been an error downloading the playlist" },
      { status: 500 }
    );
  }
};
