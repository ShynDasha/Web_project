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
    name: "Бездротові навушники",
    description: "Зручні навушники для щоденного використання та прослуховування музики.",
    price: 2499,
  },
  {
    id: "p-101",
    name: "Механічна клавіатура",
    description: "Компактна клавіатура для навчання, роботи та повсякденного використання.",
    price: 3199,
  },
  {
    id: "p-102",
    name: "Монітор",
    description: "Широкоформатний дисплей для роботи, навчання та мультимедіа.",
    price: 8799,
  },
  {
    id: "p-103",
    name: "Бездротова миша",
    description: "Легка комп'ютерна миша зі стабільним з'єднанням і зручним керуванням.",
    price: 1299,
  },
  {
    id: "p-104",
    name: "Підставка для ноутбука",
    description: "Регульована підставка для зручнішої роботи за робочим місцем.",
    price: 1599,
  },
  {
    id: "p-105",
    name: "USB-хаб",
    description: "Багатопортовий адаптер для заряджання, передавання даних і підключення пристроїв.",
    price: 1899,
  },
  {
    id: "p-106",
    name: "Вебкамера",
    description: "Камера для онлайн-зустрічей, дистанційного навчання та відеозв'язку.",
    price: 2199,
  },
  {
    id: "p-107",
    name: "Портативна колонка",
    description: "Компактна акустична система з чистим звуком і тривалим часом роботи.",
    price: 2799,
  },
  {
    id: "p-108",
    name: "Зовнішній SSD-накопичувач",
    description: "Швидкий портативний накопичувач для файлів, резервних копій і проєктів.",
    price: 4299,
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
