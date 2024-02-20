import { downloadSingularTrack } from "@/lib/downloader";
import { NextResponse } from "next/server";

export const POST = async (request) => {
  const requestJSON = await request.json();
  const track = requestJSON.data;

  try {
    // Download the audio stream
    const audioStream = await downloadSingularTrack(track);

    // Convert the audio stream to a blob
    const blob = new Blob([audioStream]);

    // Read the blob to ensure it's fully loaded
    await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve();
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(blob);
    });

    // Return the blob in the response
    return new Response(blob, {
      headers: {
        "Content-Type": "audio/mpeg", // Adjust the content type based on the audio format
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
