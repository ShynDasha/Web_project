const http = require("http");

const PORT = process.env.PORT || 4002;
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

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { service: "product-service", status: "ok" });
    return;
  }

  if (req.method === "GET" && req.url === "/products") {
    sendJson(res, 200, { products });
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`product-service listening on http://localhost:${PORT}`);
});
