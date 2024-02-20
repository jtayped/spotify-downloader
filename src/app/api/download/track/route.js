import { downloadSingularTrack } from "@/lib/downloader";
import { NextResponse } from "next/server";

export const POST = async (request) => {
  const requestJSON = await request.json();
  const { track } = requestJSON;

  try {
    // Download the audio track and get the Blob
    const blob = await downloadSingularTrack(track);
    console.log(blob);

    // Return the Blob in the response
    return new Response(blob, {
      headers: {
        "Content-Type": "audio/mpeg", // Set the appropriate content type
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "There has been an error downloading the track" },
      { status: 500 }
    );
  }
};
