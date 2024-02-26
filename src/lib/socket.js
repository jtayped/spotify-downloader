const io = new Server({
  path: "/api/socket",
  addTrailingSlash: false,
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

export default io;
