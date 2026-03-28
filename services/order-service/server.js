const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const PORT = process.env.PORT || 4003;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-service:4002";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:4004";
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, "../../certs/localhost-key.pem");
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, "../../certs/localhost.pem");

const orders = [];

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

function readUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(authHeader.slice(7), "base64url").toString("utf-8"));
  } catch (error) {
    return null;
  }
}

async function fetchProducts() {
  const response = await fetch(`${PRODUCT_SERVICE_URL}/products`);
  const payload = await response.json();
  return payload.products || [];
}

async function notify(order) {
  await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userEmail: order.userEmail,
      message: `Замовлення ${order.id} успішно створено.`,
    }),
  });
}

async function requestHandler(req, res) {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { service: "order-service", status: "ok" });
      return;
    }

    const user = readUserFromToken(req.headers.authorization);
    if (!user) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    if (req.method === "GET" && req.url === "/orders") {
      const userOrders = orders.filter((order) => order.userId === user.id);
      sendJson(res, 200, { orders: userOrders });
      return;
    }

    if (req.method === "POST" && req.url === "/orders") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const items = Array.isArray(body.items) ? body.items : [];

      if (items.length === 0) {
        sendJson(res, 400, { error: "Order must contain at least one item" });
        return;
      }

      const products = await fetchProducts();
      const normalizedItems = items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: Number(item.quantity) || 1,
        };
      });

      const total = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const order = {
        id: `order-${orders.length + 1}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        items: normalizedItems,
        total,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      orders.push(order);
      await notify(order);
      sendJson(res, 201, { order });
      return;
    }

    sendJson(res, 404, { error: "Route not found" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Order service error" });
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
  console.log(`order-service listening on ${protocol}://localhost:${PORT}`);
});
