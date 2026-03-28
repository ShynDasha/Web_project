# HTTPS у межах демонстраційного проєкту

## Що саме варто захистити

Для студентського демо не обов'язково будувати повноцінне шифрування між усіма мікросервісами. Достатньо показати, що:

- користувач відкриває frontend по `HTTPS`;
- frontend надсилає запити до `API Gateway` по `HTTPS`;
- далі `API Gateway` вже працює з внутрішніми сервісами.

Такий підхід реалістичний, бо в багатьох системах TLS завершується саме на gateway, load balancer або ingress-рівні.

## Схема для пояснення

```text
Browser -- HTTPS --> Frontend -- HTTPS --> API Gateway -- HTTP --> Auth Service
                                                      -- HTTP --> Product Service
                                                      -- HTTP --> Order Service
Order Service -- HTTP --> Notification Service
```

## Чому цього достатньо для захисту

- демонструється використання HTTPS у вебзастосунку;
- пояснюється роль gateway як точки термінації TLS;
- показується компроміс між правильною архітектурою і простотою навчальної реалізації.

## Як демонструвати

1. Запусти сервіси.
2. Відкрий `https://localhost:3443`.
3. Покажи замок або сам URL з `https`.
4. Поясни, що клієнтський трафік зашифрований.
5. Покажи робочий сценарій: вхід, перегляд товарів, оформлення замовлення.
6. Додай фразу, що в production-версії можна реалізувати HTTPS між усіма сервісами.

## Якщо викладач спитає про повний HTTPS

Можна відповісти так:

У демонстраційній версії HTTPS реалізовано на рівні користувацького входу в систему, тобто між браузером, frontend і API Gateway. Це дозволяє показати принцип захищеної передачі даних без суттєвого ускладнення інфраструктури. У промисловому середовищі внутрішню взаємодію сервісів також можна захистити за допомогою reverse proxy, ingress-controller або service mesh.

А якщо потрібно показати повний HTTPS-контур, то цей проєкт підтримує і такий режим: усі внутрішні сервіси можна запускати через `ENABLE_HTTPS=true`, а `api-gateway` та `order-service` направляти на `https://`-адреси сервісів.

## Якщо порти зайняті

Frontend і gateway у цьому проєкті можна запускати на інших портах:

- для gateway змінюй `PORT`;
- для frontend передавай `API_GATEWAY_HTTPS_URL`, щоб клієнт знав адресу gateway.

Приклад:

```bash
cd /Users/dashasin/Downloads/Web_project/api-gateway
ENABLE_HTTPS=true PORT=4450 AUTH_SERVICE_URL=http://localhost:4001 PRODUCT_SERVICE_URL=http://localhost:4002 ORDER_SERVICE_URL=http://localhost:4003 node server.js
```

```bash
cd /Users/dashasin/Downloads/Web_project/frontend
ENABLE_HTTPS=true PORT=3443 API_GATEWAY_HTTPS_URL=https://localhost:4450 node server.js
```

## Full HTTPS сценарій

```text
Browser -- HTTPS --> Frontend -- HTTPS --> API Gateway -- HTTPS --> Auth Service
                                                      -- HTTPS --> Product Service
                                                      -- HTTPS --> Order Service
Order Service -- HTTPS --> Notification Service
```

Для локального демо використовується один self-signed сертифікат, тому процесам, які викликають інші сервіси, потрібен параметр:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0
```

Його слід додавати для:

- `api-gateway`
- `order-service`

Це не production-практика, а спрощення для показу локальної TLS-взаємодії між мікросервісами.
