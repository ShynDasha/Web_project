const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const PORT = process.env.PORT || 4002;
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, "../../certs/localhost-key.pem");
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, "../../certs/localhost.pem");
const products = [
  {
    id: "p-100",
    name: "Навушники Aurora",
    description: "Бездротові навушники для щоденного використання.",
    price: 2499,
  },
  {
    id: "p-101",
    name: "Механічна клавіатура Forge",
    description: "Компактна клавіатура для навчання, роботи й ігор.",
    price: 3199,
  },
  {
    id: "p-102",
    name: "Монітор Horizon 27",
    description: "27-дюймовий IPS-монітор для продуктивної роботи.",
    price: 8799,
  },
];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function requestHandler(req, res) {
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { service: "product-service", status: "ok" });
    return;
  }

  if (req.method === "GET" && req.url === "/products") {
    sendJson(res, 200, { products });
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
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
  console.log(`product-service listening on ${protocol}://localhost:${PORT}`);
});
