import { downloadSingularTrack } from "@/lib/downloader";
import { NextResponse } from "next/server";
const fs = require("fs");
const path = require("path");

export const POST = async (request) => {
  const requestJSON = await request.json();
  const track = requestJSON.data;

  try {
    const filePath = await downloadSingularTrack(track);

    // Read the track data asynchronously
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
      { message: "There has been an error downloading the track" },
      { status: 500 }
    );
  }
};
