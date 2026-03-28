const http = require("http");

const PORT = process.env.PORT || 4004;
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

const server = http.createServer(async (req, res) => {
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
});

server.listen(PORT, () => {
  console.log(`notification-service listening on http://localhost:${PORT}`);
});
