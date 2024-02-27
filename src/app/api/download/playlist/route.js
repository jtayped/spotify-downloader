import { downloadPlaylist } from "@/lib/downloader";
import { serverTimestamp } from "@/lib/util";
import filenamify from "filenamify";
import { NextResponse } from "next/server";

export const POST = async (request, response) => {
  const playlist = await request.json();

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set(
    "Content-Disposition",
    `attachment; filename="${filenamify(playlist.name).replace(
      /[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu,
      ""
    )}.zip"`
  );
  responseHeaders.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
  );

  try {
    // Call downloadPlaylist function to generate the zip file
    const { blob, errors } = await downloadPlaylist(playlist, (progress) => {});

    errors.notFound.map((track) => {
      console.log(
        `[${serverTimestamp()}]: Couldn't find ${track.name} by ${
          track.artists[0].name
        }...`
      );
    });

    return new Response(blob, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "There has been an error downloading the playlist" },
      { status: 500 }
    );
  }
};
