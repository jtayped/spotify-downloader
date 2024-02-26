import { downloadPlaylist } from "@/lib/downloader";
import filenamify from "filenamify";
import { NextResponse } from "next/server";
// import io from "@/lib/socket";
import { SOCKET_PORT } from "@/config/app";
import { Server } from "socket.io";

let io; // Singleton WebSocket server instance

// Function to initialize WebSocket server
const initializeWebSocketServer = () => {
  io = new Server({
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  console.log("aaa")
  io.on("connection", () => {
    console.log("Client connected")
  })
  io.connectTimeout = Infinity;
  io.listen(SOCKET_PORT);

  return io;
};

export const POST = async (request, response) => {
  // Init socket.io if not initialised
  if (!io) {
    io = initializeWebSocketServer();
  }
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
    const data = await downloadPlaylist(playlist, (progress) =>
      io.emit("progress", progress)
    );

    return new Response(data, {
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
