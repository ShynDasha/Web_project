const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const PORT = process.env.PORT || 4000;
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, "../certs/localhost-key.pem");
const SSL_CERT_PATH =
  process.env.SSL_CERT_PATH || path.join(__dirname, "../certs/localhost.pem");
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || "http://auth-service:4001",
  products: process.env.PRODUCT_SERVICE_URL || "http://product-service:4002",
  orders: process.env.ORDER_SERVICE_URL || "http://order-service:4003",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

async function proxyRequest(res, targetUrl, req, body) {
  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
    },
    ...(body ? { body } : {}),
  });

  const text = await upstream.text();
  res.writeHead(upstream.status, {
    "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(text);
}

async function requestHandler(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { service: "api-gateway", status: "ok" });
      return;
    }

    if (req.method === "GET" && req.url === "/api/products") {
      await proxyRequest(res, `${SERVICE_URLS.products}/products`, req);
      return;
    }

    if (req.method === "POST" && req.url === "/api/auth/login") {
      const body = await readBody(req);
      await proxyRequest(res, `${SERVICE_URLS.auth}/login`, req, body);
      return;
    }

    if (req.method === "GET" && req.url === "/api/orders") {
      await proxyRequest(res, `${SERVICE_URLS.orders}/orders`, req);
      return;
    }

    if (req.method === "POST" && req.url === "/api/orders") {
      const body = await readBody(req);
      await proxyRequest(res, `${SERVICE_URLS.orders}/orders`, req, body);
      return;
    }

    sendJson(res, 404, { error: "Route not found" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Gateway error" });
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
  console.log(`api-gateway listening on ${protocol}://localhost:${PORT}`);
});
