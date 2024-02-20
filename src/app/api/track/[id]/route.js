import { getTrack } from "@/lib/downloader";
import { NextResponse } from "next/server";

export const GET = async (request, { params }) => {
  const id = params.id;

  if (!id)
    return NextResponse.json(
      { message: "Provide a track ID" },
      { status: 400 }
    );

  try {
    const track = await getTrack(id);
    return NextResponse.json(track);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "There has been an error downloading the track" },
      { status: 500 }
    );
  }
};
