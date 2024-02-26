import { SOCKET_PORT } from "@/config/app";
import { Server } from "socket.io";

const io = new Server({
  path: "/api/socket",
  addTrailingSlash: false,
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});
io.connectTimeout = Infinity;
io.listen(SOCKET_PORT);

export default io;
