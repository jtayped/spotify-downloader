const express = require("express");
const https = require("https");
const fs = require("fs");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.all("*", (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const httpsOptions = {
    key: fs.readFileSync("./server.key"),
    cert: fs.readFileSync("./server.cert"),
  };

  https.createServer(httpsOptions, server).listen(443, (err) => {
    if (err) throw err;
    console.log("> Ready on https://localhost:443");
  });
});
