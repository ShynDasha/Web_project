const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, "../certs/localhost-key.pem");
const SSL_CERT_PATH =
  process.env.SSL_CERT_PATH || path.join(__dirname, "../certs/localhost.pem");
const API_GATEWAY_HTTP_URL = process.env.API_GATEWAY_HTTP_URL || "http://localhost:4000";
const API_GATEWAY_HTTPS_URL = process.env.API_GATEWAY_HTTPS_URL || "https://localhost:4443";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function requestHandler(req, res) {
  if (req.url === "/config.js") {
    const config = `window.__APP_CONFIG__ = ${JSON.stringify({
      apiGatewayHttpUrl: API_GATEWAY_HTTP_URL,
      apiGatewayHttpsUrl: API_GATEWAY_HTTPS_URL,
    })};`;
    res.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
    });
    res.end(config);
    return;
  }

  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
    });
    res.end(data);
  });
}

const server = ENABLE_HTTPS
  ? https.createServer(
      {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH),
      },
      requestHandler
    )
  : http.createServer(requestHandler);

server.listen(PORT, () => {
  const protocol = ENABLE_HTTPS ? "https" : "http";
  console.log(`frontend listening on ${protocol}://localhost:${PORT}`);
});
