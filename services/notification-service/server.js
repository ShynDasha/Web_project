const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const PORT = process.env.PORT || 4004;
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, "../../certs/localhost-key.pem");
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, "../../certs/localhost.pem");
const notifications = [];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function requestHandler(req, res) {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { service: "notification-service", status: "ok" });
      return;
    }

    if (req.method === "GET" && req.url === "/notifications") {
      sendJson(res, 200, { notifications });
      return;
    }

    if (req.method === "POST" && req.url === "/notify") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const notification = {
        id: `notification-${notifications.length + 1}`,
        userEmail: body.userEmail,
        message: body.message,
        createdAt: new Date().toISOString(),
      };

      notifications.push(notification);
      console.log(`[notification-service] ${notification.userEmail}: ${notification.message}`);
      sendJson(res, 201, { notification });
      return;
    }

    sendJson(res, 404, { error: "Route not found" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Notification service error" });
  }
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
  console.log(`notification-service listening on ${protocol}://localhost:${PORT}`);
});
