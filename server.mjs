import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") url = "/index.html";
  const filePath = path.join(root, url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
