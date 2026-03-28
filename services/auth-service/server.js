const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const PORT = process.env.PORT || 4001;
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, "../../certs/localhost-key.pem");
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, "../../certs/localhost.pem");
const users = [];

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

function createToken(user) {
  return Buffer.from(JSON.stringify(user)).toString("base64url");
}

async function requestHandler(req, res) {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { service: "auth-service", status: "ok" });
      return;
    }

    if (req.method === "POST" && req.url === "/login") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const { name, email } = body;

      if (!name || !email) {
        sendJson(res, 400, { error: "Name and email are required" });
        return;
      }

      let user = users.find((entry) => entry.email === email);
      if (!user) {
        user = {
          id: `user-${users.length + 1}`,
          name,
          email,
        };
        users.push(user);
      }

      sendJson(res, 200, {
        user,
        token: createToken(user),
      });
      return;
    }

    sendJson(res, 404, { error: "Route not found" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Auth service error" });
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
  console.log(`auth-service listening on ${protocol}://localhost:${PORT}`);
});
